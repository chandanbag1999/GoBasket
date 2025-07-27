const mongoose = require('mongoose');
require('dotenv').config();

async function testCartAPI() {
  try {
    const mongoUri = process.env.MONGODB_URI + 'GoBusket';
    await mongoose.connect(mongoUri);
    
    const Product = require('./src/models/Product');
    const User = require('./src/models/User');
    const Cart = require('./src/models/Cart');
    
    console.log('🧪 Testing Cart API Functionality...\n');
    
    // Test with the non-existent product ID first
    console.log('🔍 Test 1: Non-existent Product ID');
    const nonExistentId = '6886348a367d8ad4b6129a01';
    console.log('- Product ID:', nonExistentId);
    
    const nonExistentProduct = await Product.findById(nonExistentId);
    console.log('- Product exists:', nonExistentProduct ? '✅ YES' : '❌ NO');
    
    if (!nonExistentProduct) {
      console.log('- Expected API Response: 404 - Product not found');
    }
    
    console.log('\n' + '='.repeat(50));
    
    // Test with working product IDs
    console.log('\n🔍 Test 2: Working Product IDs');
    
    const workingProductIds = [
      '6886282b331ad65a01f13bc1', // Margherita Pizza
      '68863348246ded783a254790'  // Test Pizza Active
    ];
    
    for (const productId of workingProductIds) {
      console.log(`\n📦 Testing Product ID: ${productId}`);
      
      const product = await Product.findById(productId)
        .populate('restaurant', 'name restaurantProfile.restaurantName');
      
      if (!product) {
        console.log('❌ Product not found');
        continue;
      }
      
      console.log('✅ Product Details:');
      console.log('- Name:', product.name);
      console.log('- Status:', product.status);
      console.log('- Available:', product.isAvailable);
      console.log('- Restaurant:', product.restaurant?.name);
      console.log('- Variants:', product.variants?.length || 0);
      
      // Check availability for cart
      const canOrder = product.isAvailable && product.status === 'active';
      console.log('- Can Order:', canOrder ? '✅ YES' : '❌ NO');
      
      if (canOrder) {
        // Check if Medium variant exists
        const mediumVariant = product.variants.find(v => v.name === 'Medium');
        console.log('- Has Medium variant:', mediumVariant ? '✅ YES' : '❌ NO');
        
        if (mediumVariant) {
          console.log('- Medium variant price:', mediumVariant.price);
          console.log('- Medium variant available:', mediumVariant.isAvailable);
        }
        
        // Simulate cart item data
        const cartItemData = {
          productId: productId,
          quantity: 2,
          selectedVariant: {
            name: "Medium",
            price: mediumVariant ? mediumVariant.price : 399,
            preparationTime: 20
          },
          customizations: [
            {
              name: "Extra Toppings",
              selectedOptions: [
                {
                  name: "Extra Cheese",
                  price: 50
                },
                {
                  name: "Mushrooms", 
                  price: 30
                }
              ]
            }
          ],
          specialInstructions: "Less spicy please"
        };
        
        console.log('\n📋 Cart Item Data for API:');
        console.log(JSON.stringify(cartItemData, null, 2));
        
        console.log('\n📊 Expected API Response Structure:');
        console.log(`{
  "success": true,
  "message": "Item added to cart successfully",
  "data": {
    "cart": {
      "_id": "...",
      "user": "...",
      "restaurant": "${product.restaurant._id}",
      "items": [
        {
          "product": "${productId}",
          "productSnapshot": {
            "name": "${product.name}",
            "basePrice": ${product.basePrice},
            "isAvailable": ${product.isAvailable}
          },
          "selectedVariant": {
            "name": "Medium",
            "price": ${mediumVariant ? mediumVariant.price : 399},
            "preparationTime": 20
          },
          "customizations": [...],
          "quantity": 2,
          "specialInstructions": "Less spicy please"
        }
      ],
      "totalAmount": ${(mediumVariant ? mediumVariant.price : 399) * 2 + 80},
      "status": "active"
    }
  }
}`);
        
        break; // Use the first working product for detailed testing
      }
    }
    
    // Get test user for authentication
    console.log('\n' + '='.repeat(50));
    console.log('\n👤 Authentication Setup:');
    
    const testUser = await User.findOne({ email: 'test@customer.com' });
    if (testUser) {
      console.log('✅ Test user exists:', testUser._id);
      console.log('- Email:', testUser.email);
      console.log('- Role:', testUser.role);
      console.log('\n🔐 To get JWT token, login with:');
      console.log('POST http://localhost:5000/api/v1/auth/login');
      console.log(JSON.stringify({
        email: 'test@customer.com',
        password: 'password123'
      }, null, 2));
    } else {
      console.log('❌ Test user not found. Create one first.');
    }
    
    console.log('\n🎯 RECOMMENDED SOLUTION:');
    console.log('1. Use Product ID: 6886282b331ad65a01f13bc1 (Margherita Pizza)');
    console.log('2. Login to get JWT token');
    console.log('3. Make cart request with proper authentication');
    console.log('4. Expect complete JSON response, not truncated');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testCartAPI();
