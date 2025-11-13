# 🔄 Quick Restart Instructions

## ⚡ **Super Fast Restart (1 minute)**

1. **Run the startup script:**
   ```powershell
   # From Development folder
   .\start-inventory-system.ps1
   ```

2. **Or manually start both servers:**
   ```powershell
   # Terminal 1 - Django Backend
   cd ..\inventory_project
   .\venv\Scripts\Activate.ps1
   python manage.py runserver
   
   # Terminal 2 - React Frontend  
   cd inventory-frontend
   npm start
   ```

3. **Verify everything works:**
   ```powershell
   node test-api.js
   ```

## 🎯 **Current Status**
- ✅ Phase 1 Complete: Frontend-Backend Integration
- 🎯 Ready for Phase 2: Real-Time Features  
- 📊 System: 100% operational with full API connectivity

## 📋 **What's Working**
- Django API: http://localhost:8000/api/
- React App: http://localhost:3000
- Dashboard with real sales data (₦18.5M total)
- All CRUD operations (Products, Customers, Orders)

## 🚀 **Next Development Phase**
Phase 2: Real-Time Features & Advanced Analytics

---

*See ../PROJECT_RESTART_GUIDE.md for complete documentation*