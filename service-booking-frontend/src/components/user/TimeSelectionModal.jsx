import React, { useState, useEffect, useRef } from 'react';
import { format, addHours, addDays, setHours, setMinutes, isSameDay, isBefore, startOfDay, isWithinInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, Clock, X } from 'lucide-react';
import API from '../../api/axios';

const TimeSelectionModal = ({ 
  initialPickup, 
  initialReturn, 
  vehicleId,
  onConfirm, 
  onClose
}) => {
  const modalRef = useRef();
  const now = new Date();
  
  const [pickup, setPickup] = useState(initialPickup);
  const [returnTime, setReturnTime] = useState(initialReturn);
  const [activeTab, setActiveTab] = useState('pickup');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false); //
  
  const totalHours = Math.max(Math.round((returnTime - pickup) / (1000 * 60 * 60)), 0);
  const totalDays = Math.floor(totalHours / 24);
  const remainHours = totalHours % 24;
  
  const minPickupTime = addHours(now, 2);
  const pickupHour = pickup.getHours();
  const returnHour = returnTime.getHours();
  const isPickupInvalidTime = pickupHour < 7 || pickupHour >= 22;
  const isReturnInvalidTime = returnHour < 7 || returnHour >= 22;

  //: Fetch booked slots khi component mount
  useEffect(() => {
    if (vehicleId) {
      fetchBookedSlots();
    }
  }, [vehicleId]);

  const fetchBookedSlots = async () => {
    try {
      setIsLoadingSlots(true);
      const endDate = addDays(now, 30);
      const res = await API.get(`/api/vehicles/${vehicleId}/booked-slots`, {
        params: {
          startDate: now.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      
      if (res.data.success) {
        setBookedSlots(res.data.bookedSlots.map(slot => ({
          start: new Date(slot.start),
          end: new Date(slot.end),
          status: slot.status
        })));
      }
    } catch (err) {
      console.error('Error fetching booked slots:', err);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  //: Hàm kiểm tra ngày có bị booked không
  const isDateBooked = (date) => {
    return bookedSlots.some(slot => {
      const slotStart = startOfDay(slot.start);
      const slotEnd = startOfDay(slot.end);
      const checkDate = startOfDay(date);
      
      return isWithinInterval(checkDate, { 
        start: slotStart, 
        end: slotEnd 
      });
    });
  };

  //: Hàm kiểm tra giờ có bị booked không
  const isHourBooked = (date, hour) => {
    const checkTime = setHours(setMinutes(date, 0), hour);
    
    return bookedSlots.some(slot => {
      // Thêm buffer 1 giờ trước và sau
      const slotStart = new Date(slot.start.getTime() - 60 * 60 * 1000);
      const slotEnd = new Date(slot.end.getTime() + 60 * 60 * 1000);
      
      return isWithinInterval(checkTime, { 
        start: slotStart, 
        end: slotEnd 
      });
    });
  };

  // Close modal khi click outside
  useEffect(() => {
    const onClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [onClose]);

  useEffect(() => {
    if (isBefore(returnTime, pickup)) {
      setReturnTime(addDays(pickup, 1));
    }
  }, [pickup, returnTime]);

  const handleConfirm = async () => {
    const diffHours = Math.round((returnTime - pickup) / (1000 * 60 * 60));
    
    if (diffHours < 4) {
      alert('Thời gian thuê tối thiểu là 4 giờ!');
      return;
    }

    if (isBefore(pickup, minPickupTime)) {
      alert('Thời gian nhận xe phải sau ít nhất 2 giờ kể từ bây giờ!');
      return;
    }

    //: Kiểm tra availability trước khi confirm
    try {
      const res = await API.post(`/api/vehicles/${vehicleId}/check-availability`, {
        pickupDate: pickup.toISOString(),
        returnDate: returnTime.toISOString()
      });

      if (!res.data.available) {
        alert('Xe đã được đặt trong khung giờ này. Vui lòng chọn thời gian khác.');
        return;
      }
    } catch (err) {
      console.error('Error checking availability:', err);
      alert('Không thể kiểm tra tình trạng xe. Vui lòng thử lại.');
      return;
    }

    onConfirm({
      pickupDate: format(pickup, 'yyyy-MM-dd'),
      pickupTime: format(pickup, 'HH:00'),
      returnDate: format(returnTime, 'yyyy-MM-dd'),
      returnTime: format(returnTime, 'HH:00'),
      pickupFull: format(pickup, 'yyyy-MM-dd HH:00'),
      returnFull: format(returnTime, 'yyyy-MM-dd HH:00'),
      totalHours,
      totalDays,
      remainHours
    });
  };

  const renderDatePicker = () => {
    const targetDate = activeTab === 'pickup' ? pickup : returnTime;
    const setTargetDate = activeTab === 'pickup' ? setPickup : setReturnTime;
    
    const days = Array.from({ length: 30 }, (_, i) => addDays(now, i));
    
    return (
      <div className="space-y-2">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
              {day}
            </div>
          ))}
        </div>
        
        {/* Loading indicator */}
        {isLoadingSlots && (
          <div className="text-center py-4 text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-xs mt-2">Đang tải lịch đặt xe...</p>
          </div>
        )}
        
        {/* Date buttons */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {days.map(day => {
            const isSelected = isSameDay(day, targetDate);
            
            let isDisabled;
            if (activeTab === 'pickup') {
              isDisabled = isBefore(startOfDay(day), startOfDay(minPickupTime));
            } else {
              isDisabled = isBefore(startOfDay(day), startOfDay(pickup));
            }
            
            const isToday = isSameDay(day, now);
            const isBooked = isDateBooked(day);
            
            return (
              <button
                key={day.toISOString()}
                disabled={isDisabled}
                onClick={() => {
                  const newDate = setHours(setMinutes(day, 0), targetDate.getHours());
                  setTargetDate(newDate);
                }}
                className={`
                  w-full p-3 rounded-lg text-left transition-all flex items-center justify-between
                  ${isDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                  ${isSelected ? 'bg-green-600 text-white font-bold shadow-md' : ''}
                  ${!isSelected && !isDisabled ? 'hover:bg-green-50 border border-gray-200' : ''}
                  ${isToday && !isSelected ? 'border-2 border-green-400' : ''}
                  ${isBooked && !isSelected && !isDisabled ? 'bg-orange-50 border-orange-300' : ''}
                `}
              >
                <div className="flex-1">
                  <div className="font-semibold">
                    {format(day, 'EEEE, dd/MM/yyyy', { locale: vi })}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {isToday && <div className="text-xs opacity-75">Hôm nay</div>}
                    {isBooked && !isSelected && (
                      <div className="text-xs text-orange-600">⚠️ Một số giờ đã được đặt</div>
                    )}
                  </div>
                </div>
                {isSelected && <span className="text-xl">✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderHourSelector = () => {
    const targetDate = activeTab === 'pickup' ? pickup : returnTime;
    const setTargetDate = activeTab === 'pickup' ? setPickup : setReturnTime;
    const currentHour = targetDate.getHours();
    
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const disabledHours = [];
    
    if (activeTab === 'pickup' && isSameDay(pickup, now)) {
      const minHour = minPickupTime.getHours();
      for (let h = 0; h < minHour; h++) {
        disabledHours.push(h);
      }
    }
    
    if (activeTab === 'return' && isSameDay(returnTime, pickup)) {
      const minHour = pickup.getHours() + 4;
      for (let h = 0; h < minHour; h++) {
        disabledHours.push(h);
      }
    }

    return (
      <div className="grid grid-cols-6 gap-2">
        {hours.map(h => {
          const disabled = disabledHours.includes(h);
          const active = currentHour === h;
          const isInvalidTime = h < 7 || h >= 22;
          const isBooked = isHourBooked(targetDate, h);
          
          return (
            <button
              key={h}
              disabled={disabled || isBooked}
              onClick={() => setTargetDate(setHours(setMinutes(targetDate, 0), h))}
              className={`
                rounded-lg py-2 text-sm transition-all relative border
                ${disabled || isBooked ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200' : ''}
                ${active && !disabled && !isBooked ? 'bg-green-600 text-white font-bold border-green-600' : ''}
                ${!active && !disabled && !isBooked ? 'hover:bg-green-100 border-gray-200' : ''}
                ${isInvalidTime && !disabled && !active && !isBooked ? 'border-yellow-400 border-2' : ''}
              `}
            >
              {h.toString().padStart(2, '0')}:00
              {isInvalidTime && !disabled && !isBooked && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
              )}
              {isBooked && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold">Chọn thời gian thuê xe</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Tab selector */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('pickup')}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'pickup'
                  ? 'bg-white shadow-md text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Calendar size={18} />
                Ngày nhận xe
              </div>
              <div className="text-sm mt-1">
                {format(pickup, 'dd/MM/yyyy HH:mm', { locale: vi })}
              </div>
              {isPickupInvalidTime && (
                <div className="text-xs text-yellow-600 mt-1">Ngoài giờ hoạt động</div>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('return')}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'return'
                  ? 'bg-white shadow-md text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Calendar size={18} />
                Ngày trả xe
              </div>
              <div className="text-sm mt-1">
                {format(returnTime, 'dd/MM/yyyy HH:mm', { locale: vi })}
              </div>
              {isReturnInvalidTime && (
                <div className="text-xs text-yellow-600 mt-1">Ngoài giờ hoạt động</div>
              )}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Date selector */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar size={18} />
                Chọn ngày
              </h3>
              {renderDatePicker()}
            </div>

            {/* Hour selector */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock size={18} />
                Chọn giờ
              </h3>
              <div className="space-y-2 mb-3">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs">
                  <span className="font-semibold text-yellow-700">Lưu ý:</span> Giờ có viền vàng (22h-7h) nằm ngoài giờ hoạt động
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs">
                  <span className="font-semibold text-red-700">Giờ đã đặt:</span> Giờ có dấu đỏ đã được đặt bởi người khác
                </div>
              </div>
              {renderHourSelector()}
            </div>
          </div>

          {/* Duration summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Tổng thời gian thuê</div>
              <div className="text-3xl font-bold text-green-600">
                {totalDays > 0 && `${totalDays} ngày `}
                {remainHours} giờ
              </div>
              <div className="text-sm text-gray-500 mt-1">
                (Tổng: {totalHours} giờ)
              </div>
            </div>
          </div>

          {/* Warnings */}
          {(isPickupInvalidTime || isReturnInvalidTime) && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex items-start gap-3">
                <span className="text-yellow-600 text-xl"></span>
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1">Thời gian ngoài giờ hoạt động</p>
                  <p>
                    {isPickupInvalidTime && 'Giờ nhận xe '}
                    {isPickupInvalidTime && isReturnInvalidTime && 'và '}
                    {isReturnInvalidTime && 'giờ trả xe '}
                    nằm ngoài khung 7:00 - 22:00. Bạn vẫn có thể tiếp tục đặt xe.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Xác nhận thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeSelectionModal;