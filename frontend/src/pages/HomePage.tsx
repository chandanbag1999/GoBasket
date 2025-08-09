import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TruckIcon, Shield, Headphones, ArrowRight } from "lucide-react";

const HomePage: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                Fresh Groceries
                <br />
                <span className="text-primary-foreground/90">
                  Delivered Fast
                </span>
              </h1>
              <p className="text-xl mb-8 text-primary-foreground/90">
                Get fresh vegetables, fruits, and daily essentials delivered to
                your doorstep in 30 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/products">
                    Shop Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  View Categories
                </Button>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop"
                alt="Fresh Groceries"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white text-gray-900 p-4 rounded-xl shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="bg-green-100 p-2 rounded-full">
                    <TruckIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">30 Min Delivery</p>
                    <p className="text-sm text-gray-600">
                      Free on orders ₹999+
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-4">
                <TruckIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">
                Get your groceries delivered in 30 minutes or less
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fresh Quality</h3>
              <p className="text-gray-600">
                Hand-picked fresh products with quality guarantee
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-4">
                <Headphones className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">
                Round-the-clock customer support for your convenience
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Categories Section */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Shop by Category</h2>
          <p className="text-gray-600 text-lg">
            Explore our wide range of fresh and quality products
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[
            { name: "Vegetables", emoji: "🥬", link: "/categories/vegetables" },
            { name: "Fruits", emoji: "🍎", link: "/categories/fruits" },
            { name: "Dairy", emoji: "🥛", link: "/categories/dairy" },
            { name: "Grains", emoji: "🌾", link: "/categories/grains" },
            { name: "Meat", emoji: "🥩", link: "/categories/meat" },
            { name: "Beverages", emoji: "🥤", link: "/categories/beverages" },
          ].map((category) => (
            <Link key={category.name} to={category.link}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                    {category.emoji}
                  </div>
                  <h3 className="font-semibold">{category.name}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Featured Products</h2>
          <Button variant="outline" asChild>
            <Link to="/products">View All</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              id: 1,
              name: "Fresh Organic Tomatoes",
              price: 89,
              originalPrice: 120,
              image:
                "https://images.unsplash.com/photo-1546470427-e5e5c3d3e2f3?w=300&h=200&fit=crop",
              rating: 4.5,
              discount: 25,
            },
            {
              id: 2,
              name: "Premium Basmati Rice",
              price: 299,
              originalPrice: 399,
              image:
                "https://images.unsplash.com/photo-1586201375761-83865001e198?w=300&h=200&fit=crop",
              rating: 4.8,
              discount: 25,
            },
            {
              id: 3,
              name: "Fresh Milk 1L",
              price: 65,
              originalPrice: 75,
              image:
                "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=200&fit=crop",
              rating: 4.6,
              discount: 13,
            },
            {
              id: 4,
              name: "Organic Bananas",
              price: 45,
              originalPrice: 60,
              image:
                "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&h=200&fit=crop",
              rating: 4.4,
              discount: 25,
            },
          ].map((product) => (
            <Card
              key={product.id}
              className="group hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform"
                  />
                  <Badge className="absolute top-2 left-2 bg-red-500">
                    {product.discount}% OFF
                  </Badge>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>

                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600 ml-1">
                        {product.rating}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-primary">
                        ₹{product.price}
                      </span>
                      <span className="text-sm text-gray-500 line-through ml-2">
                        ₹{product.originalPrice}
                      </span>
                    </div>
                    <Button size="sm">Add to Cart</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Special Offers */}
      <section className="bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Special Offers</h2>
            <p className="text-gray-600">
              Don't miss out on these amazing deals
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white overflow-hidden">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-2">Fresh Vegetables</h3>
                <p className="mb-4">Up to 40% off on all fresh vegetables</p>
                <Button variant="secondary">Shop Vegetables</Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white overflow-hidden">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-2">Fruits Bonanza</h3>
                <p className="mb-4">Buy 2 Get 1 Free on selected fruits</p>
                <Button variant="secondary">Shop Fruits</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
