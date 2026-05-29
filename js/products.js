const PRODUCTS = [
  { id: 1, name: "Rustic Boule Loaf", price: 12, unit: "loaf", image: "Assets/Product%20Images/1.jpg", description: "A hearty round loaf with a golden crust and soft, airy crumb — perfect for slicing at the table." },
  { id: 2, name: "Cinnamon Raisin Bread", price: 11, unit: "loaf", image: "Assets/Product%20Images/2.jpg", description: "Warm cinnamon-swirled bread packed with sweet raisins, ideal for breakfast toast." },
  { id: 3, name: "Blueberry Muffins", price: 14, unit: "6-pack", image: "Assets/Product%20Images/3.jpg", description: "Tender muffins loaded with juicy blueberries and a light vanilla finish." },
  { id: 4, name: "Brownie Bites", price: 16, unit: "dozen", image: "Assets/Product%20Images/4.jpg", description: "Rich, fudgy brownie bites with deep chocolate flavor in every two-bite square." },
  { id: 5, name: "Snickerdoodle Cookies", price: 13, unit: "dozen", image: "Assets/Product%20Images/5.jpg", description: "Soft cookies rolled in cinnamon sugar with a classic crackly top and cozy spice." },
  { id: 6, name: "Fudge Brownie Square", price: 4, unit: "each", image: "Assets/Product%20Images/6.jpg", description: "One thick, decadent square of dense chocolate brownie for a serious sweet fix." },
  { id: 7, name: "Chocolate Chip Cookies", price: 14, unit: "dozen", image: "Assets/Product%20Images/7.jpg", description: "Chewy, buttery cookies studded with melty chocolate chips — a crowd favorite." },
  { id: 8, name: "Pumpkin Bread Loaf", price: 12, unit: "loaf", image: "Assets/Product%20Images/8.jpg", description: "Moist spiced pumpkin bread with warm fall flavors in every slice." },
  { id: 9, name: "Banana Nut Muffins", price: 14, unit: "6-pack", image: "Assets/Product%20Images/9.jpg", description: "Ripe banana muffins topped with crunchy walnuts for a homestyle morning treat." },
  { id: 10, name: "Vanilla Cupcakes", price: 18, unit: "6-pack", image: "Assets/Product%20Images/10.jpg", description: "Fluffy vanilla cupcakes finished with smooth, swirled buttercream frosting." },
  { id: 11, name: "Red Velvet Cupcake", price: 4, unit: "each", image: "Assets/Product%20Images/11.jpg", description: "A single red velvet cupcake with cocoa notes and creamy frosting on top." },
  { id: 12, name: "Almond Flour Cookies", price: 13, unit: "dozen", image: "Assets/Product%20Images/12.jpg", description: "Lightly crisp cookies with a nutty almond flavor and delicate sweetness." },
  { id: 13, name: "Carrot Cake Slice", price: 6, unit: "slice", image: "Assets/Product%20Images/13.jpg", description: "Spiced carrot cake slice with walnuts and classic cream cheese frosting." },
  { id: 14, name: "Celebration Layer Cake", price: 45, unit: "cake", image: "Assets/Product%20Images/14.jpg", description: "A custom stacked layer cake made to order for birthdays and special occasions." },
  { id: 15, name: "Oatmeal Raisin Cookies", price: 13, unit: "dozen", image: "Assets/Product%20Images/15.jpg", description: "Hearty oatmeal cookies with plump raisins and a hint of brown sugar warmth." },
  { id: 16, name: "Lemon Bars", price: 18, unit: "pan", image: "Assets/Product%20Images/16.jpg", description: "Tangy lemon curd on a buttery shortbread base, dusted with powdered sugar." },
  { id: 17, name: "Chocolate Ganache Tart", price: 22, unit: "tart", image: "Assets/Product%20Images/17.jpg", description: "Silky chocolate ganache in a crisp tart shell — an elegant dessert for sharing." },
  { id: 18, name: "Double Chocolate Cookies", price: 14, unit: "dozen", image: "Assets/Product%20Images/18.jpg", description: "Deep cocoa cookies with chocolate chips for an extra-rich chocolate lover's dozen." },
  { id: 19, name: "Strawberry Shortcake Cup", price: 5, unit: "each", image: "Assets/Product%20Images/19.jpg", description: "A single-serve cup of biscuit, fresh strawberries, and lightly sweetened cream." },
  { id: 20, name: "Artisan Sourdough Round", price: 14, unit: "loaf", image: "Assets/Product%20Images/20.jpg", description: "Slow-fermented sourdough round with a tangy aroma and chewy, open crumb." },
];

function getProductById(id) {
  return PRODUCTS.find(function (p) {
    return p.id === id;
  });
}
