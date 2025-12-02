import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../../context/SearchContext";
import { format, addHours, addDays, setHours, setMinutes, isSameDay, isBefore } from "date-fns";
import { vi } from "date-fns/locale";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../css/datepicker-custom.css";

import AutocompleteLocation from "./AutocompleteLocation";

// ========================================================================
//                              SEARCH SECTION
// ========================================================================
const SearchSection = () => {
  const { searchData, setSearchData } = useSearch();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // ================= DEFAULT TIME RULE =================
  const now = new Date();
  let defaultPickup = addHours(now, 2);

  if (defaultPickup.getMinutes() > 15) {
    defaultPickup = setHours(defaultPickup, defaultPickup.getHours() + 1);
    defaultPickup = setMinutes(defaultPickup, 0);
  }

  const defaultReturn = addHours(defaultPickup, 52);

  const [form, setForm] = useState({
    location: searchData?.location || "",
    locationData: searchData?.locationData || null,
    pickupDate: searchData?.pickupDate || format(defaultPickup, "yyyy-MM-dd"),
    pickupTime: searchData?.pickupTime || format(defaultPickup, "HH:00"),
    returnDate: searchData?.returnDate || format(defaultReturn, "yyyy-MM-dd"),
    returnTime: searchData?.returnTime || format(defaultReturn, "HH:00"),
  });

  // ================= STICKY FORM =================
  const [isSticky, setIsSticky] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsSticky(window.scrollY > 250);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ================== SEARCH LOGIC ==================
  const performSearch = (payload) => {
    const pickup = new Date(`${payload.pickupDate}T${payload.pickupTime}`);
    const ret = new Date(`${payload.returnDate}T${payload.returnTime}`);

    if (isBefore(ret, pickup)) return alert("Ngày trả phải sau ngày nhận!");

    const totalHours = Math.round((ret - pickup) / (1000 * 60 * 60));
    const totalDays = Math.floor(totalHours / 24);
    const remainHours = totalHours % 24;

    const searchInfo = {
      ...payload,
      pickupFull: format(pickup, "yyyy-MM-dd HH:00"),
      returnFull: format(ret, "yyyy-MM-dd HH:00"),
      totalHours,
      totalDays,
      remainHours,
    };

    setSearchData(searchInfo);
    navigate("/vehicles");
  };

  const handleSearch = () => {
    if (isLoading) return;
    setIsLoading(true);

    setTimeout(() => {
      performSearch(form);
      setIsLoading(false);
    }, 800);
  };

  return (
    <>
      {/* ================= NORMAL FORM (NON-STICKY) ================= */}
      <div
        className={`absolute top-[10%] left-1/2 -translate-x-1/2 z-[50] w-full flex justify-center transition-all duration-500 ${
          isSticky ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="w-full max-w-6xl bg-white/40 backdrop-blur-sm p-6 rounded-2xl shadow-md grid grid-cols-1 md:grid-cols-6 gap-4">
          <FormContent
            form={form}
            setForm={setForm}
            handleSearch={handleSearch}
            openExpanded={() => setShowExpanded(true)}
          />
        </div>
      </div>

      {/* ================= STICKY FORM ================= */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 w-full flex justify-center transition-all duration-500 ease-in-out z-[60] ${
          isSticky
            ? "top-0 opacity-100 translate-y-0 bg-white/95 shadow-lg"
            : "top-0 opacity-0 -translate-y-10 pointer-events-none"
        }`}
      >
        <div className="w-full max-w-6xl bg-white/95 p-4 rounded-b-2xl shadow-md grid grid-cols-1 md:grid-cols-6 gap-4">
          <FormContent
            form={form}
            setForm={setForm}
            handleSearch={handleSearch}
            openExpanded={() => setShowExpanded(true)}
          />
        </div>
      </div>

      {/* ================= EXPANDED MODAL ================= */}
      {showExpanded && (
        <ExpandedSearchModal
          form={form}
          setForm={setForm}
          onClose={() => setShowExpanded(false)}
          onSearch={(updated) => performSearch(updated)}
        />
      )}
    </>
  );
};

// ========================================================================
//                           FORM CONTENT (Top Bar + Sticky Bar)
// ========================================================================
const FormContent = ({ form, handleSearch, openExpanded }) => (
  <>
    {/* ========== AUTOCOMPLETE ĐỊA ĐIỂM ========== */}
    <div>
      <label className="text-sm font-semibold">Địa điểm (tùy chọn)</label>

      <div onClick={openExpanded} className="cursor-pointer">
        <input
          type="text"
          readOnly
          value={form.location}
          placeholder="Nhập địa điểm tìm xe"
          className="border rounded-lg px-3 py-2 w-full bg-gray-50 hover:bg-green-50 cursor-pointer"
        />
      </div>
    </div>

    {/* NGÀY GIỜ */}
    <div>
      <label className="text-sm font-semibold">Ngày nhận</label>
      <input
        type="date"
        value={form.pickupDate}
        readOnly
        onClick={openExpanded}
        className="border rounded-lg px-3 py-2 w-full hover:bg-green-50 cursor-pointer"
      />
    </div>

    <div>
      <label className="text-sm font-semibold">Giờ nhận</label>
      <div
        onClick={openExpanded}
        className="border rounded-lg px-3 py-2 w-full bg-white hover:bg-green-50 cursor-pointer"
      >
        <span>{form.pickupTime}</span>
      </div>
    </div>

    <div>
      <label className="text-sm font-semibold">Ngày trả</label>
      <input
        type="date"
        value={form.returnDate}
        readOnly
        onClick={openExpanded}
        className="border rounded-lg px-3 py-2 w-full hover:bg-green-50 cursor-pointer"
      />
    </div>

    <div>
      <label className="text-sm font-semibold">Giờ trả</label>
      <div
        onClick={openExpanded}
        className="border rounded-lg px-3 py-2 w-full bg-white hover:bg-green-50 cursor-pointer"
      >
        <span>{form.returnTime}</span>
      </div>
    </div>

    <div className="flex items-end">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleSearch();
        }}
        className="bg-green-600 text-white rounded-lg px-4 py-2 w-full hover:bg-green-700"
      >
        Tìm xe
      </button>
    </div>
  </>
);

// ========================================================================
//                       EXPANDED MODAL (FULL SEARCH FORM)
// ========================================================================
const ExpandedSearchModal = ({ form, setForm, onClose, onSearch }) => {
  const modalRef = useRef();

  const now = new Date();
  const [pickup, setPickup] = useState(
    new Date(`${form.pickupDate}T${form.pickupTime}`)
  );
  const [ret, setRet] = useState(
    new Date(`${form.returnDate}T${form.returnTime}`)
  );

  const [showCalendar, setShowCalendar] = useState(false);
  const [focusedField, setFocusedField] = useState("pickup");

  const totalHours = Math.max(
    Math.round((ret - pickup) / (1000 * 60 * 60)),
    0
  );
  const totalDays = Math.floor(totalHours / 24);
  const remainHours = totalHours % 24;

  const hours = Array.from({ length: 24 }, (_, i) => i);

  let baseMinHour = now.getHours();
  if (now.getMinutes() > 15) baseMinHour += 1;

  const minPickupHour = isSameDay(pickup, now) ? baseMinHour + 2 : 0;

  // ========== OUTSIDE CLICK CLOSE CALENDAR ==========
  useEffect(() => {
    const onClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target))
        setShowCalendar(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (isBefore(ret, pickup)) setRet(addDays(pickup, 1));
  }, [pickup, ret]);

  const onRangeChange = (dates) => {
    const [start, end] = dates;

    if (focusedField === "pickup") {
      if (start) setPickup(start);
      if (end) setRet(end);
    } else {
      if (end) {
        setPickup(start);
        setRet(end);
      } else if (start) {
        if (start >= pickup) setRet(start);
        else {
          setPickup(start);
          setRet(addDays(start, 1));
          setFocusedField("pickup");
        }
      }
    }
  };

  const handleConfirm = () => {
    const diffHours = Math.round((ret - pickup) / (1000 * 60 * 60));
    if (diffHours < 4)
      return alert("Thời gian thuê tối thiểu là 4 giờ!");

    const newForm = {
      ...form,
      pickupDate: format(pickup, "yyyy-MM-dd"),
      pickupTime: format(pickup, "HH:00"),
      returnDate: format(ret, "yyyy-MM-dd"),
      returnTime: format(ret, "HH:00"),
      totalHours,
      totalDays,
      remainHours,
    };

    setForm(newForm);
    onClose();
    onSearch(newForm);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200]">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl p-6 md:p-8 shadow-xl w-full max-w-3xl relative max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl z-10"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-center mb-6">
          Tìm xe
        </h2>

        {/* ================= AUTOCOMPLETE LOCATION ================= */}
        <div className="mb-5">
          <label className="block font-semibold mb-1">
            Địa điểm thuê xe (tùy chọn)
          </label>

          <AutocompleteLocation
            value={form.location}
            onSelect={(label, obj) =>
              setForm({
                ...form,
                location: label,
                locationData: obj,
              })
            }
            placeholder="Nhập địa chỉ của bạn tại TP.HCM"
          />
          <p className="text-xs text-gray-500 mt-1">
            Nhập địa chỉ để xem xe gần bạn hoặc bỏ trống để xem tất cả
          </p>
        </div>

        {/* ================= DATE SELECT ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 relative">
          <div>
            <label className="block font-semibold mb-1">
              Ngày nhận
            </label>
            <input
              readOnly
              value={pickup ? format(pickup, "dd/MM/yyyy") : ""}
              onClick={() => {
                setFocusedField("pickup");
                setShowCalendar(true);
              }}
              className="border rounded-lg px-3 py-2 w-full cursor-pointer hover:bg-green-50"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">
              Ngày trả
            </label>
            <input
              readOnly
              value={ret ? format(ret, "dd/MM/yyyy") : ""}
              onClick={() => {
                setFocusedField("return");
                setShowCalendar(true);
              }}
              className="border rounded-lg px-3 py-2 w-full cursor-pointer hover:bg-green-50"
            />
          </div>

          {showCalendar && (
            <div className="absolute left-0 top-full w-full md:w-[720px] mt-3 z-50">
              <div className="bg-white border rounded-xl shadow-2xl p-3">
                <div className="custom-datepicker-wrapper mx-auto">
                  <DatePicker
                    selected={pickup}
                    onChange={onRangeChange}
                    startDate={pickup}
                    endDate={ret}
                    minDate={addHours(now, 2)}
                    selectsRange
                    inline
                    monthsShown={2}
                    locale={vi}
                    calendarClassName="custom-react-datepicker"
                  />
                </div>

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => setShowCalendar(false)}
                    className="px-4 py-2 rounded-lg border"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => {
                      if (!ret || isBefore(ret, pickup))
                        setRet(addDays(pickup, 1));
                      setShowCalendar(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Xong
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= TIME SELECT ================= */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <HourSelect
            label="Giờ nhận"
            date={pickup}
            setDate={setPickup}
            disabledHours={hours.filter(
              (h) => isSameDay(pickup, now) && h < minPickupHour
            )}
          />
          <HourSelect label="Giờ trả" date={ret} setDate={setRet} />
        </div>

        {/* ================= DISPLAY RENT TIME ================= */}
        <p className="text-center text-gray-600 mb-4">
          Thời gian thuê:{" "}
          <span className="font-semibold">
            {totalDays} ngày {remainHours} giờ
          </span>
        </p>

        <button
          onClick={handleConfirm}
          className="w-full bg-green-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-green-700"
        >
          Tìm xe
        </button>
      </div>
    </div>
  );
};

// ========================================================================
//                            HOUR SELECT COMPONENT
// ========================================================================
const HourSelect = ({ label, date, setDate, disabledHours = [] }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const currentHour = parseInt(format(date, "H"));

  return (
    <div>
      <label className="font-semibold">{label}</label>
      <div className="grid grid-cols-6 gap-1 mt-1">
        {hours.map((h) => {
          const disabled = disabledHours.includes(h);
          const active = currentHour === h;

          return (
            <button
              key={h}
              disabled={disabled}
              onClick={() =>
                setDate(setHours(setMinutes(date, 0), h))
              }
              className={`rounded-md py-1 text-sm transition ${
                disabled
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : active
                  ? "bg-green-600 text-white"
                  : "hover:bg-green-100"
              }`}
            >
              {`${h.toString().padStart(2, "0")}:00`}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SearchSection;