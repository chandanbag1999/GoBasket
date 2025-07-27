const mongoose = require('mongoose');
require('dotenv').config();

async function testProductCreation() {
  try {
    const mongoUri = process.env.MONGODB_URI + 'GoBusket';
    await mongoose.connect(mongoUri);
    
    const Product = require('./src/models/Product');
    const Category = require('./src/models/Category');
    const User = require('./src/models/User');
    
    console.log('🧪 Testing Product Creation with Status Field...\n');
    
    // Get existing category and restaurant
    const category = await Category.findOne({ name: /pizza/i });
    const restaurant = await User.findOne({ role: { $in: ['admin', 'restaurant-owner'] } });
    
    if (!category || !restaurant) {
      console.log('❌ Missing category or restaurant user');
      return;
    }
    
    console.log('📋 Test Setup:');
    console.log('- Category:', category.name, '(' + category._id + ')');
    console.log('- Restaurant:', restaurant.name, '(' + restaurant._id + ')');
    
    // Test 1: Create product with status "active"
    console.log('\n🧪 Test 1: Creating product with status "active"');
    
    const productData1 = {
      name: "Test Pizza Active",
      description: "Test pizza with active status",
      shortDescription: "Test pizza",
      category: category._id,
      restaurant: restaurant._id,
      basePrice: 299,
      status: "active", // Explicitly set to active
      variants: [
        {
          name: "Medium",
          price: 399,
          preparationTime: 20,
          isAvailable: true
        }
      ],
      isVegetarian: true,
      spiceLevel: "mild",
      preparationTime: 20,
      tags: ["pizza", "test"],
      ingredients: ["Test ingredients"]
    };
    
    const product1 = await Product.create(productData1);
    console.log('✅ Product 1 created:');
    console.log('- ID:', product1._id);
    console.log('- Name:', product1.name);
    console.log('- Status (Expected: active):', product1.status);
    console.log('- Status Match:', product1.status === 'active' ? '✅ YES' : '❌ NO');
    
    // Test 2: Create product with status "draft"
    console.log('\n🧪 Test 2: Creating product with status "draft"');
    
    const productData2 = {
      name: "Test Pizza Draft",
      description: "Test pizza with draft status",
      shortDescription: "Test pizza",
      category: category._id,
      restaurant: restaurant._id,
      basePrice: 299,
      status: "draft", // Explicitly set to draft
      variants: [
        {
          name: "Medium",
          price: 399,
          preparationTime: 20,
          isAvailable: true
        }
      ],
      isVegetarian: true,
      spiceLevel: "mild",
      preparationTime: 20,
      tags: ["pizza", "test"],
      ingredients: ["Test ingredients"]
    };
    
    const product2 = await Product.create(productData2);
    console.log('✅ Product 2 created:');
    console.log('- ID:', product2._id);
    console.log('- Name:', product2.name);
    console.log('- Status (Expected: draft):', product2.status);
    console.log('- Status Match:', product2.status === 'draft' ? '✅ YES' : '❌ NO');
    
    // Test 3: Create product without status (should default to draft)
    console.log('\n🧪 Test 3: Creating product without status field');
    
    const productData3 = {
      name: "Test Pizza No Status",
      description: "Test pizza without status field",
      shortDescription: "Test pizza",
      category: category._id,
      restaurant: restaurant._id,
      basePrice: 299,
      // No status field
      variants: [
        {
          name: "Medium",
          price: 399,
          preparationTime: 20,
          isAvailable: true
        }
      ],
      isVegetarian: true,
      spiceLevel: "mild",
      preparationTime: 20,
      tags: ["pizza", "test"],
      ingredients: ["Test ingredients"]
    };
    
    const product3 = await Product.create(productData3);
    console.log('✅ Product 3 created:');
    console.log('- ID:', product3._id);
    console.log('- Name:', product3.name);
    console.log('- Status (Expected: draft):', product3.status);
    console.log('- Status Match:', product3.status === 'draft' ? '✅ YES' : '❌ NO');
    
    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('- Test 1 (active):', product1.status === 'active' ? '✅ PASS' : '❌ FAIL');
    console.log('- Test 2 (draft):', product2.status === 'draft' ? '✅ PASS' : '❌ FAIL');
    console.log('- Test 3 (default):', product3.status === 'draft' ? '✅ PASS' : '❌ FAIL');
    
    const allPassed = product1.status === 'active' && product2.status === 'draft' && product3.status === 'draft';
    console.log('\n🎯 Overall Result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
    
    if (allPassed) {
      console.log('\n🎉 Status field is now working correctly!');
      console.log('📋 Available Product IDs for testing:');
      console.log('- Active Product:', product1._id);
      console.log('- Draft Product:', product2._id);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testProductCreation();
