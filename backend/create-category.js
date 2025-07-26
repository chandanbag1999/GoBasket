const mongoose = require('mongoose');
require('dotenv').config();

// Import the Category model
const Category = require('./src/models/Category');

async function createPizzaCategory() {
  try {
    // Connect to MongoDB using the same connection as the app
    const mongoUri = process.env.MONGODB_URI + 'GoBusket';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    
    // Check if Pizza category already exists
    const existingCategory = await Category.findOne({ name: /pizza/i });
    
    if (existingCategory) {
      console.log('Pizza category already exists:');
      console.log(`- Name: ${existingCategory.name}`);
      console.log(`- ID: ${existingCategory._id}`);
      console.log(`- Slug: ${existingCategory.slug}`);
      await mongoose.disconnect();
      return;
    }
    
    // Create Pizza category
    const pizzaCategory = await Category.create({
      name: 'Pizza',
      description: 'Delicious pizzas with various toppings and crusts',
      cuisine: 'Italian',
      tags: ['pizza', 'italian', 'fast-food'],
      displayOrder: 1,
      isFeatured: true,
      meta: {
        seoTitle: 'Pizza - Order Online',
        seoDescription: 'Order delicious pizzas online with fast delivery'
      }
    });
    
    console.log('✅ Pizza category created successfully!');
    console.log(`- Name: ${pizzaCategory.name}`);
    console.log(`- ID: ${pizzaCategory._id}`);
    console.log(`- Slug: ${pizzaCategory.slug}`);
    
    // Create a few more sample categories
    const categories = [
      {
        name: 'Burgers',
        description: 'Juicy burgers with fresh ingredients',
        cuisine: 'American',
        tags: ['burger', 'american', 'fast-food'],
        displayOrder: 2
      },
      {
        name: 'Indian',
        description: 'Authentic Indian cuisine',
        cuisine: 'Indian',
        tags: ['indian', 'curry', 'spicy'],
        displayOrder: 3
      },
      {
        name: 'Beverages',
        description: 'Refreshing drinks and beverages',
        cuisine: 'Beverages',
        tags: ['drinks', 'beverages', 'refreshing'],
        displayOrder: 4
      }
    ];
    
    const createdCategories = await Category.insertMany(categories);
    console.log(`\n✅ Created ${createdCategories.length} additional categories:`);
    createdCategories.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat._id})`);
    });
    
    console.log('\n🎉 All categories created successfully!');
    console.log('\nYou can now use these category IDs in your product creation requests.');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error creating categories:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
createPizzaCategory();
