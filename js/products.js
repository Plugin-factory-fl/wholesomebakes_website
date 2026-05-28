const PRODUCTS = [
  { id: 1, name: "Rustic Boule Loaf", price: 12, unit: "loaf", image: "Assets/Product%20Images/1.jpg" },
  { id: 2, name: "Cinnamon Raisin Bread", price: 11, unit: "loaf", image: "Assets/Product%20Images/2.jpg" },
  { id: 3, name: "Blueberry Muffins", price: 14, unit: "6-pack", image: "Assets/Product%20Images/3.jpg" },
  { id: 4, name: "Brownie Bites", price: 16, unit: "dozen", image: "Assets/Product%20Images/4.jpg" },
  { id: 5, name: "Snickerdoodle Cookies", price: 13, unit: "dozen", image: "Assets/Product%20Images/5.jpg" },
  { id: 6, name: "Fudge Brownie Square", price: 4, unit: "each", image: "Assets/Product%20Images/6.jpg" },
  { id: 7, name: "Chocolate Chip Cookies", price: 14, unit: "dozen", image: "Assets/Product%20Images/7.jpg" },
  { id: 8, name: "Pumpkin Bread Loaf", price: 12, unit: "loaf", image: "Assets/Product%20Images/8.jpg" },
  { id: 9, name: "Banana Nut Muffins", price: 14, unit: "6-pack", image: "Assets/Product%20Images/9.jpg" },
  { id: 10, name: "Vanilla Cupcakes", price: 18, unit: "6-pack", image: "Assets/Product%20Images/10.jpg" },
  { id: 11, name: "Red Velvet Cupcake", price: 4, unit: "each", image: "Assets/Product%20Images/11.jpg" },
  { id: 12, name: "Almond Flour Cookies", price: 13, unit: "dozen", image: "Assets/Product%20Images/12.jpg" },
  { id: 13, name: "Carrot Cake Slice", price: 6, unit: "slice", image: "Assets/Product%20Images/13.jpg" },
  { id: 14, name: "Celebration Layer Cake", price: 45, unit: "cake", image: "Assets/Product%20Images/14.jpg" },
  { id: 15, name: "Oatmeal Raisin Cookies", price: 13, unit: "dozen", image: "Assets/Product%20Images/15.jpg" },
  { id: 16, name: "Lemon Bars", price: 18, unit: "pan", image: "Assets/Product%20Images/16.jpg" },
  { id: 17, name: "Chocolate Ganache Tart", price: 22, unit: "tart", image: "Assets/Product%20Images/17.jpg" },
  { id: 18, name: "Double Chocolate Cookies", price: 14, unit: "dozen", image: "Assets/Product%20Images/18.jpg" },
  { id: 19, name: "Strawberry Shortcake Cup", price: 5, unit: "each", image: "Assets/Product%20Images/19.jpg" },
  { id: 20, name: "Artisan Sourdough Round", price: 14, unit: "loaf", image: "Assets/Product%20Images/20.jpg" },
];

function getProductById(id) {
  return PRODUCTS.find(function (p) {
    return p.id === id;
  });
}
