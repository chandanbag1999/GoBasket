const mongoose = require('mongoose');
require('dotenv').config();

async function checkProduct() {
  try {
    const mongoUri = process.env.MONGODB_URI + 'GoBusket';
    await mongoose.connect(mongoUri);

    const Product = require('./src/models/Product');
    const Category = require('./src/models/Category');
    const User = require('./src/models/User');

    console.log('🔍 Checking specific product and all products in database...\n');

    // Check the specific product ID from the request
    const requestedProductId = '6886348a367d8ad4b6129a01';
    console.log(`🎯 Checking requested product ID: ${requestedProductId}`);

    const requestedProduct = await Product.findById(requestedProductId)
      .populate('restaurant', 'name restaurantProfile.restaurantName');

    if (requestedProduct) {
      console.log('✅ Requested product found:');
      console.log('- Name:', requestedProduct.name);
      console.log('- Status:', requestedProduct.status);
      console.log('- Available:', requestedProduct.isAvailable);
      console.log('- Restaurant:', requestedProduct.restaurant?.name || 'Unknown');
      console.log('- Variants:', requestedProduct.variants?.length || 0);

      const isOrderable = requestedProduct.isAvailable && requestedProduct.status === 'active';
      console.log('- Can Order:', isOrderable ? '✅ YES' : '❌ NO');

      if (!isOrderable) {
        const issues = [];
        if (!requestedProduct.isAvailable) issues.push('isAvailable = false');
        if (requestedProduct.status !== 'active') issues.push(`status = '${requestedProduct.status}'`);
        console.log('- Issues:', issues.join(', '));
      }
    } else {
      console.log('❌ Requested product NOT FOUND');
    }

    console.log('\n' + '='.repeat(50));

    // Check all products in database
    const existingProducts = await Product.find({}, 'name status isAvailable _id restaurant variants')
      .populate('restaurant', 'name restaurantProfile.restaurantName')
      .limit(10);

    console.log('📋 All products in database:\n');

    if (existingProducts.length === 0) {
      console.log('📋 No products found in database. Creating a sample product...');

      // Get or create a category
      let category = await Category.findOne({ name: /pizza/i });
      if (!category) {
        console.log('📂 Creating Pizza category...');
        category = await Category.create({
          name: 'Pizza',
          description: 'Delicious pizzas with various toppings and crusts',
          cuisine: 'Italian',
          tags: ['pizza', 'italian', 'fast-food'],
          displayOrder: 1,
          isFeatured: true,
          isActive: true
        });
        console.log('✅ Pizza category created:', category._id);
      }

      // Get or create a restaurant user
      let restaurant = await User.findOne({ role: { $in: ['admin', 'restaurant-owner'] } });
      if (!restaurant) {
        console.log('👨‍🍳 Creating restaurant user...');
        restaurant = await User.create({
          name: 'Test Restaurant',
          email: 'restaurant@test.com',
          phone: '+1234567890',
          password: 'password123',
          role: 'restaurant-owner',
          isActive: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          restaurantProfile: {
            restaurantName: 'Test Pizza Restaurant',
            cuisine: ['Italian'],
            description: 'Best pizza in town',
            isVerified: true
          }
        });
        console.log('✅ Restaurant user created:', restaurant._id);
      }

      // Create sample product
      const sampleProduct = await Product.create({
        name: "Margherita Pizza",
        description: "Classic Italian pizza with fresh mozzarella, tomato sauce, and basil leaves",
        shortDescription: "Classic Margherita with fresh ingredients",
        category: category._id,
        restaurant: restaurant._id,
        basePrice: 299,
        variants: [
          {
            name: "Small",
            price: 299,
            preparationTime: 15,
            isAvailable: true
          },
          {
            name: "Medium",
            price: 399,
            preparationTime: 20,
            isAvailable: true
          },
          {
            name: "Large",
            price: 499,
            preparationTime: 25,
            isAvailable: true
          }
        ],
        customizations: [
          {
            name: "Extra Toppings",
            type: "multiple",
            isRequired: false,
            options: [
              {
                name: "Extra Cheese",
                price: 50,
                isAvailable: true
              },
              {
                name: "Mushrooms",
                price: 30,
                isAvailable: true
              }
            ]
          }
        ],
        isVegetarian: true,
        spiceLevel: "mild",
        preparationTime: 20,
        tags: ["pizza", "vegetarian", "italian"],
        ingredients: ["Pizza base", "Mozzarella cheese", "Tomato sauce", "Fresh basil"],
        isAvailable: true,
        status: 'active'
      });

      console.log('✅ Sample product created successfully!');
      console.log('- Product ID:', sampleProduct._id);
      console.log('- Name:', sampleProduct.name);
      console.log('- Status:', sampleProduct.status);
      console.log('- Available:', sampleProduct.isAvailable);
      console.log('\n🎯 Use this Product ID in your cart request:', sampleProduct._id);

    } else {
      console.log(`� Found ${existingProducts.length} product(s):\n`);

      existingProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   📋 ID: ${product._id}`);
        console.log(`   📊 Status: ${product.status}`);
        console.log(`   ✅ Available: ${product.isAvailable}`);
        console.log(`   🏪 Restaurant: ${product.restaurant?.name || 'Unknown'}`);
        console.log(`   🔧 Variants: ${product.variants?.length || 0}`);

        // Check availability conditions
        const isOrderable = product.isAvailable && product.status === 'active';
        console.log(`   🎯 Can Order: ${isOrderable ? '✅ YES' : '❌ NO'}`);

        if (!isOrderable) {
          const issues = [];
          if (!product.isAvailable) issues.push('Not Available');
          if (product.status !== 'active') issues.push(`Status: ${product.status}`);
          console.log(`   ⚠️  Issues: ${issues.join(', ')}`);
        }
        console.log('');
      });

      // Find the first orderable product
      const orderableProduct = existingProducts.find(p => p.isAvailable && p.status === 'active');
      if (orderableProduct) {
        console.log(`🎯 RECOMMENDED PRODUCT ID FOR TESTING: ${orderableProduct._id}`);
      } else {
        console.log('❌ No orderable products found. Need to fix product availability.');
      }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProduct();
