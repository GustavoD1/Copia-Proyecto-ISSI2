import { check } from 'express-validator'
import { Product, Restaurant, Order } from '../../models/models.js'

const checkIfRestaurantExists = async (value, { req }) => {
  try {
    const restaurant = await Restaurant.findByPk(req.body.restaurantId)
    if (restaurant === null) {
      return Promise.reject(new Error('The restaurant does not exist.'))
    } else {
      return Promise.resolve()
    }
  } catch (err) {
    return Promise.reject(new Error(err))
  }
}

const checkIfProductsAreAvailable = async (value, { req }) => {
  try {
    const products = req.body.products
    for (const p of products) {
      const currentProduct = await Product.findByPk(p.productId)
      if (currentProduct.availability === false) {
        return Promise.reject(new Error('Product not available'))
      }
    }
    return Promise.resolve()
  } catch (err) {
    return Promise.reject(err)
  }
}

const checkProductsBelongToRestaurant = async (value, { req }) => {
  try {
    const products = req.body.products
    const possibleRestaurants = []
    for (const p of products) {
      const currentProduct = await Product.findByPk(p.productId)
      possibleRestaurants.push(currentProduct.restaurantId)
    }
    const allSameRestaurant = possibleRestaurants.every(value => value === possibleRestaurants[0])
    if (allSameRestaurant === false) {
      return Promise.reject(new Error('All products do not belong to the same restaurant'))
    }
    return Promise.resolve()
  } catch (err) {
    return Promise.reject(new Error(err))
  }
}

const checkProductsBelongToRestaurantForUpdate = async (value, { req }) => {
  try {
    const products = req.body.products
    const oldOrder = await Order.findByPk(req.params.orderId)
    const oldProducts = oldOrder.products
    products.concat(oldProducts)

    const possibleRestaurants = []
    for (const p of products) {
      const currentProduct = await Product.findByPk(p.productId)
      possibleRestaurants.push(currentProduct.restaurantId)
    }
    const allSameRestaurant = possibleRestaurants.every(value => value === possibleRestaurants[0])
    if (allSameRestaurant === false) {
      return Promise.reject(new Error('All products do not belong to the same restaurant'))
    }
    return Promise.resolve()
  } catch (err) {
    return Promise.reject(new Error(err))
  }
}

// TODO: Include validation rules for create that should:
// 1. Check that restaurantId is present in the body and corresponds to an existing restaurant
// 2. Check that products is a non-empty array composed of objects with productId and quantity greater than 0
// 3. Check that products are available
// 4. Check that all the products belong to the same restaurant
const create = [
  check('restaurantId').exists().custom(checkIfRestaurantExists),
  check('products').exists().isArray().notEmpty(),
  check('products').custom(checkIfProductsAreAvailable).custom(checkProductsBelongToRestaurant),
  check('products.*.productId').isInt({ min: 1 }),
  check('products.*.quantity').isInt({ min: 1 }),
  check('address').exists().isString().isLength({ min: 1, max: 255 }).trim()
]
// TODO: Include validation rules for update that should:
// 1. Check that restaurantId is NOT present in the body.
// 2. Check that products is a non-empty array composed of objects with productId and quantity greater than 0
// 3. Check that products are available
// 4. Check that all the products belong to the same restaurant of the originally saved order that is being edited.
// 5. Check that the order is in the 'pending' state.
const update = [
  check('restaurantId').isEmpty(),
  check('products').exists().isArray().isLength({ min: 1 }),
  check('products.*.productId').isInt({ min: 1 }),
  check('products.*.quantity').isInt({ min: 1 }),
  check('products').custom(checkIfProductsAreAvailable).custom(checkProductsBelongToRestaurantForUpdate),
  check('address').exists().isString().isLength({ min: 1, max: 255 }).trim()
]

export { create, update }
