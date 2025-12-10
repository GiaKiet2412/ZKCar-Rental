import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  customerInfo: {
    name: { type: String },
    email: { type: String },
    phone: { type: String }
  },
  
  guestInfo: {
    name: { type: String },
    email: { type: String },
    phone: { type: String }
  },
  
  pickupDate: { type: Date, required: true },
  returnDate: { type: Date, required: true },
  
  pickupType: { 
    type: String, 
    enum: ['self', 'delivery'], 
    default: 'self' 
  },
  deliveryLocation: { type: String },

  pickupLocation: { type: String },
  
  originalAmount: { type: Number, required: true },
  discountCode: { type: String, uppercase: true },
  discountAmount: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },

  totalPrice: { type: Number },
  
  insuranceFee: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  VAT: { type: Number, default: 0 },
  
  depositAmount: { type: Number, default: 3000000 },
  holdFee: { type: Number, default: 500000 },
  
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'ongoing', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  paymentMethod: { 
    type: String, 
    enum: ['vnpay', 'cash', 'transfer'], 
    default: 'vnpay' 
  },

  paymentType: {
    type: String,
    enum: ['hold', 'full'],
    default: 'hold'
  },
  
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },

  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'], 
    default: 'pending' 
  },
  paidAt: { type: Date },
  
  vnpayOrderId: { type: String },
  vnpayTransactionNo: { type: String },
  vnpayBankCode: { type: String },
  
  notes: { type: String },
  
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String }
}, { timestamps: true });

bookingSchema.pre('save', function(next) {
  // Calculate totalPrice if not set
  if (!this.totalPrice) {
    this.totalPrice = this.finalAmount + (this.depositAmount || 0);
  }
  
  // Set pickupLocation if not set and pickupType is self
  if (!this.pickupLocation && this.pickupType === 'self' && this.vehicle) {
    // Will be populated from vehicle location
  } else if (this.pickupType === 'delivery' && this.deliveryLocation) {
    this.pickupLocation = this.deliveryLocation;
  }
  
  next();
});

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ vehicle: 1, pickupDate: 1, returnDate: 1 });
bookingSchema.index({ status: 1 });

export default mongoose.model('Booking', bookingSchema);