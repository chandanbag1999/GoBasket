const mongoose = require('mongoose');
require('dotenv').config();

async function testCartFunctionality() {
  try {
    const mongoUri = process.env.MONGODB_URI + 'GoBusket';
    await mongoose.connect(mongoUri);
    
    const Product = require('./src/models/Product');
    const User = require('./src/models/User');
    const Cart = require('./src/models/Cart');
    
    console.log('🧪 Testing Cart Functionality...\n');
    
    // 1. Get the test product
    const productId = '6886282b331ad65a01f13bc1';
    const product = await Product.findById(productId)
      .populate('restaurant', 'name restaurantProfile.restaurantName');
    
    if (!product) {
      console.log('❌ Product not found');
      return;
    }
    
    console.log('📦 Product Details:');
    console.log('- Name:', product.name);
    console.log('- Status:', product.status);
    console.log('- Available:', product.isAvailable);
    console.log('- Restaurant:', product.restaurant?.name);
    
    // 2. Check availability conditions (same as cart controller)
    const isAvailable = product.isAvailable && product.status === 'active';
    console.log('\n🔍 Availability Check:');
    console.log('- product.isAvailable:', product.isAvailable);
    console.log('- product.status === "active":', product.status === 'active');
    console.log('- Overall available:', isAvailable);
    
    if (!isAvailable) {
      console.log('❌ Product would fail cart validation');
      console.log('Issues:');
      if (!product.isAvailable) console.log('  - isAvailable is false');
      if (product.status !== 'active') console.log('  - status is not active:', product.status);
      return;
    }
    
    // 3. Get or create a test user
    let testUser = await User.findOne({ email: 'test@customer.com' });
    if (!testUser) {
      console.log('\n👤 Creating test customer user...');
      testUser = await User.create({
        name: 'Test Customer',
        email: 'test@customer.com',
        phone: '+1234567891',
        password: 'password123',
        role: 'customer',
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true
      });
      console.log('✅ Test user created:', testUser._id);
    } else {
      console.log('\n👤 Using existing test user:', testUser._id);
    }
    
    // 4. Test cart item creation
    console.log('\n🛒 Testing Cart Item Addition...');
    
    const cartItemData = {
      productId: productId,
      quantity: 2,
      selectedVariant: {
        name: "Medium",
        price: 399,
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
    
    // Validate selected variant
    const variant = product.variants.find(v => v.name === cartItemData.selectedVariant.name);
    if (!variant) {
      console.log('❌ Selected variant not found');
      return;
    }
    console.log('✅ Variant found:', variant.name, '$' + variant.price);
    
    // Find or create cart
    let cart = await Cart.findOne({
      user: testUser._id,
      restaurant: product.restaurant._id,
      status: 'active'
    });
    
    if (!cart) {
      console.log('📝 Creating new cart...');
      cart = new Cart({
        user: testUser._id,
        restaurant: product.restaurant._id,
        items: []
      });
    } else {
      console.log('📝 Using existing cart:', cart._id);
    }
    
    // Prepare item data (same as cart controller)
    const itemData = {
      product: productId,
      productSnapshot: {
        name: product.name,
        basePrice: product.basePrice,
        image: product.defaultImage?.secure_url,
        isAvailable: product.isAvailable
      },
      selectedVariant: variant ? {
        name: variant.name,
        price: variant.price,
        preparationTime: variant.preparationTime
      } : null,
      customizations: cartItemData.customizations || [],
      quantity: cartItemData.quantity,
      specialInstructions: cartItemData.specialInstructions || ''
    };
    
    console.log('\n📋 Item Data Prepared:');
    console.log('- Product:', itemData.product);
    console.log('- Quantity:', itemData.quantity);
    console.log('- Variant:', itemData.selectedVariant?.name);
    console.log('- Customizations:', itemData.customizations.length);
    
    // Add item to cart
    await cart.addItem(itemData);
    await cart.save();
    
    console.log('\n✅ SUCCESS! Item added to cart');
    console.log('- Cart ID:', cart._id);
    console.log('- Items in cart:', cart.items.length);
    console.log('- Total amount:', cart.totalAmount);
    
    console.log('\n🎯 CART FUNCTIONALITY IS WORKING!');
    console.log('🔧 Use this data for your Postman request:');
    console.log('- Product ID:', productId);
    console.log('- User ID (for auth):', testUser._id);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testCartFunctionality();
