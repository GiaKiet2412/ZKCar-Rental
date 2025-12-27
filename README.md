# ZKCar – Vehicle Self-Drive Rental Platform

## Project Overview

ZKCar is an end-to-end **self-drive vehicle rental platform** designed to simulate a real-world booking system for both customers and administrators. The project focuses on **full booking lifecycle management**, **secure payments**, **role-based access**, and **automation of business workflows**.

The system supports **guest users**, **registered users**, and **administrators**, allowing seamless vehicle browsing, booking, payment, and post-booking management.

This project was built as a **solo full-stack project** to demonstrate practical backend logic, system design, and real-world integrations suitable for **internship and junior full-stack roles**.

---

## User Roles

### Admin

* Manage users (view details, total spending, update, delete)
* Manage vehicles (full CRUD)
* Manage discount codes with usage conditions
* Manage bookings and booking statuses
* View revenue statistics and booking history

### Registered User

* Register account with **Email OTP verification**
* Browse available vehicles
* Create bookings with time-based pricing and discounts
* Pay via **VNPay**
* Receive booking confirmation via email

### Guest User

* Browse vehicles without registration
* Create bookings using email verification (OTP)
* Pay via VNPay
* Track bookings using **email / phone number + OTP**

---

## System Architecture

* Frontend: ReactJS, TailwindCSS, Context API
* Backend: NodeJS (ExpressJS)
* Database: MongoDB (Mongoose)
* Authentication: JWT (User / Admin)
* Email Service: SendGrid (OTP and booking notifications)
* Payment Gateway: VNPay (IPN webhook supported)
* Media Storage: Cloudinary

The project uses a **monorepo structure**, combining frontend and backend for easier development and deployment.

---

## Core Features

### Authentication and Authorization

* JWT-based authentication
* Role-based access control (Admin / User)
* OTP verification for:

  * User registration
  * Guest booking tracking

### Booking Lifecycle Automation

* Booking status flow:

```
pending -> confirmed -> ongoing -> completed
```

* Status is automatically updated based on pickup and return time
* Manual admin override is supported

### Payment Integration (VNPay)

* Supports **deposit payment** and **full payment** modes
* Secure VNPay integration
* IPN webhook handling for automatic payment confirmation
* Booking status is updated automatically after successful payment

### Discount Engine

* Multi-condition discount validation:

  * New user only
  * Nth booking
  * Minimum pre-booking days
* Discount usage tracking and limitation per user

### Smart Vehicle Search and Pricing

* Location-based matching (district and ward mapping)
* Dynamic pricing based on rental duration:

  * 4h / 8h / 12h / 24h+
* Tiered pricing with long-duration discounts

### Admin Dashboard

* Real-time booking updates using auto-polling (every 30 seconds)
* Booking status transitions
* Revenue statistics with date-based filtering

### Email Notifications

* OTP emails with reusable HTML templates
* Booking confirmation emails
* Guest booking tracking via OTP

### Media and Security

* Vehicle image upload using Cloudinary
* Rate limiting: 5 requests per 15 minutes for OTP-related APIs
* Helps prevent spam and abuse

---

## Demo and Testing

* Live Demo: [https://zk-car-rental.vercel.app](https://zk-car-rental.vercel.app)
* Demo Accounts:

  * Admin account is not public for security reasons
  * Users can freely register and test all user and guest features

---

## Local Setup

```bash
# Clone repository
git clone https://github.com/GiaKiet2412/ZKCar-Rental

# Install dependencies
npm install

# Setup environment variables
# MongoDB URI
# JWT Secret
# VNPay configuration
# SendGrid API key
# Cloudinary credentials

# Run development
npm run dev
```

---

## Highlights for Recruiters

* End-to-end booking system with automated lifecycle handling
* Secure VNPay payment integration with webhook processing
* Advanced discount validation logic based on business rules
* Clear separation of concerns in backend architecture
* Production-oriented features: OTP verification, rate limiting, cloud media storage

---

## Author

Gia Kiệt – Full Stack Developer (Intern Level)

GitHub: [https://github.com/GiaKiet2412](https://github.com/GiaKiet2412)
Project Repository: [https://github.com/GiaKiet2412/ZKCar-Rental](https://github.com/GiaKiet2412/ZKCar-Rental)
