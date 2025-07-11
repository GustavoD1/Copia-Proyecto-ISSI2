// eslint-disable-next-line no-unused-vars
import { Order, Product, Restaurant, User } from '../models/models.js'
import moment from 'moment'
import { Op } from 'sequelize'

const generateFilterWhereClauses = function (req) {
  const filterWhereClauses = []
  if (req.query.status) {
    switch (req.query.status) {
      case 'pending':
        filterWhereClauses.push({
          startedAt: null
        })
        break
      case 'in process':
        filterWhereClauses.push({
          [Op.and]: [
            {
              startedAt: {
                [Op.ne]: null
              }
            },
            { sentAt: null },
            { deliveredAt: null }
          ]
        })
        break
      case 'sent':
        filterWhereClauses.push({
          [Op.and]: [
            {
              sentAt: {
                [Op.ne]: null
              }
            },
            { deliveredAt: null }
          ]
        })
        break
      case 'delivered':
        filterWhereClauses.push({
          sentAt: {
            [Op.ne]: null
          }
        })
        break
    }
  }
  if (req.query.from) {
    const date = moment(req.query.from, 'YYYY-MM-DD', true)
    filterWhereClauses.push({
      createdAt: {
        [Op.gte]: date
      }
    })
  }
  if (req.query.to) {
    const date = moment(req.query.to, 'YYYY-MM-DD', true).endOf('day')
    filterWhereClauses.push({
      createdAt: {
        [Op.lte]: date // FIXME: se pasa al siguiente día a las 00:00 || FIXED
      }
    })
  }
  return filterWhereClauses
}

// Returns :restaurantId orders
const indexRestaurant = async function (req, res) {
  const whereClauses = generateFilterWhereClauses(req)
  whereClauses.push({
    restaurantId: req.params.restaurantId
  })
  try {
    const orders = await Order.findAll({
      where: whereClauses,
      include: {
        model: Product,
        as: 'products'
      }
    })
    res.json(orders)
  } catch (err) {
    res.status(500).send(err)
  }
}

// TODO: Implement the indexCustomer function that queries orders from current logged-in customer and send them back.
// Orders have to include products that belongs to each order and restaurant details
// sort them by createdAt date, desc. || DONE
const indexCustomer = async function (req, res) {
  const whereClauses = generateFilterWhereClauses(req)
  whereClauses.push({
    userId: req.user.id
  })
  try {
    const orders = await Order.findAll({
      where: whereClauses,
      include: [
        {
          model: Product,
          as: 'products'
        },
        {
          model: Restaurant,
          as: 'restaurant'

        }
      ]
    })
    res.json(orders)
  } catch (err) {
    res.status(500).send(err)
  }
}

// TODO: Implement the create function that receives a new order and stores it in the database. || DONE
// Take into account that:
// 1. If price is greater than 10€, shipping costs have to be 0. || DONE
// 2. If price is less or equals to 10€, shipping costs have to be restaurant default shipping costs and have to be added to the order total price || DONE
// 3. In order to save the order and related products, start a transaction, store the order, store each product linea and commit the transaction || DONE
// 4. If an exception is raised, catch it and rollback the transaction || DONE

const obtainProducts = async (bodyProducts) => {
  return await Product.findAll({ where: { id: bodyProducts.map(prod => prod.productId) } })
}

const updateOrderPrices = async (requestProducts) => {
  const products = await obtainProducts(requestProducts)
  const toReturn = [...products]
  for (let i = 0; i < toReturn.length; i++) {
    const id = toReturn[i].id
    const prod = await Product.findByPk(id)
    toReturn[i].unityPrice = prod.price
    toReturn[i].quantity = requestProducts.find(prod => prod.productId === id).quantity
  }
  return toReturn
}

const finalPrice = async (requestProducts) => {
  const products = await obtainProducts(requestProducts)
  const productsCopy = [...products]
  let price = 0
  for (let i = 0; i < productsCopy.length; i++) {
    const prod = productsCopy[i]
    const pProd = prod.price
    const qProd = requestProducts.find(pl => pl.productId === prod.id).quantity
    price += (pProd * qProd)
  }
  return price
}

const saveOrderWithUpdatedProducts = async (order, transaction, productsWithUpdatedPrices) => {
  let toReturn = await order.save({ transaction })
  for (let i = 0; i < productsWithUpdatedPrices.length; i++) {
    const prod = productsWithUpdatedPrices[i]
    await order.addProduct(prod.id, { through: { quantity: prod.quantity, unityPrice: prod.unityPrice }, transaction })
  }
  toReturn = await toReturn.reload(
    {
      include: { model: Product, as: 'products' },
      transaction
    })
  return toReturn
}

const create = async (req, res) => {
  const t = await Order.sequelize.transaction()
  const returnOrder = Order.build(req.body)
  const restaurant = await Restaurant.findByPk(req.body.restaurantId)
  returnOrder.userId = req.user.id
  returnOrder.createdAt = new Date()
  const price = await finalPrice(req.body.products)
  if (price < 10.00) {
    returnOrder.shippingCosts = restaurant.shippingCosts
  } else {
    returnOrder.shippingCosts = 0
  }
  returnOrder.price = price + returnOrder.shippingCosts
  try {
    returnOrder.products = await updateOrderPrices(req.body.products)
    const productsWithUpdatedPrices = await updateOrderPrices(req.body.products)
    await saveOrderWithUpdatedProducts(returnOrder, t, productsWithUpdatedPrices)
    const toReturn = await Order.findByPk(req.params.orderId)
    await t.commit(toReturn)
    res.json(returnOrder)
  } catch (err) {
    await t.rollback()
    res.status(500).send(err)
  }
}

// TODO: Implement the update function that receives a modified order and persists it in the database.
// Take into account that:
// 1. If price is greater than 10€, shipping costs have to be 0.
// 2. If price is less or equals to 10€, shipping costs have to be restaurant default shipping costs and have to be added to the order total price
// 3. In order to save the updated order and updated products, start a transaction, update the order, remove the old related OrderProducts and store the new product lines, and commit the transaction
// 4. If an exception is raised, catch it and rollback the transaction

const update = async function (req, res) {
  const t = await Order.sequelize.transaction()
  const returnOrder = await Order.findByPk(req.params.orderId)
  const restaurant = await Restaurant.findByPk(returnOrder.restaurantId)
  const price = await finalPrice(req.body.products)
  if (price >= 10) {
    returnOrder.shippingCosts = 0.0
  } else {
    returnOrder.shippingCosts = restaurant.shippingCosts
  }
  returnOrder.price = price + returnOrder.shippingCosts
  returnOrder.address = req.body.address

  try {
    returnOrder.products = await updateOrderPrices(req.body.products)
    const productsWithUpdatedPrices = await updateOrderPrices(req.body.products)
    await returnOrder.setProducts([], { t })
    await saveOrderWithUpdatedProducts(returnOrder, t, productsWithUpdatedPrices)
    await t.commit()
    res.json(returnOrder)
  } catch (err) {
    await t.rollback()
    res.status(500).send(err)
  }
}

// TODO: Implement the destroy function that receives an orderId as path param and removes the associated order from the database.
// Take into account that:
// 1. The migration include the "ON DELETE CASCADE" directive so OrderProducts related to this order will be automatically removed. || DONE
const destroy = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId)
    if (!order) {
      res.status(404).send('El pedido no se encuentra o ya ha sido eliminado')
    } if (getOrderStatus(order)) {
      res.status(409).send('El pedido ya ha sido confirmado, enviado o recibido')
    } else {
      await order.destroy()
      res.status(200).send('ELiminado satisfactoriamente')
    }
  } catch (err) {
    res.json(err)
  }
}

const getOrderStatus = (order) => {
  if (order.startedAt != null || order.sentAt != null || order.deliveredAt != null) {
    return true
  } else {
    return false
  }
}

const confirm = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId)
    order.startedAt = new Date()
    const updatedOrder = await order.save()
    res.json(updatedOrder)
  } catch (err) {
    res.status(500).send(err)
  }
}

const send = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId)
    order.sentAt = new Date()
    const updatedOrder = await order.save()
    res.json(updatedOrder)
  } catch (err) {
    res.status(500).send(err)
  }
}

const deliver = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId)
    order.deliveredAt = new Date()
    const updatedOrder = await order.save()
    const restaurant = await Restaurant.findByPk(order.restaurantId)
    const averageServiceTime = await restaurant.getAverageServiceTime()
    await Restaurant.update({ averageServiceMinutes: averageServiceTime }, { where: { id: order.restaurantId } })
    res.json(updatedOrder)
  } catch (err) {
    res.status(500).send(err)
  }
}

const show = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId, {
      include: [{
        model: Restaurant,
        as: 'restaurant',
        attributes: ['name', 'description', 'address', 'postalCode', 'url', 'shippingCosts', 'averageServiceMinutes', 'email', 'phone', 'logo', 'heroImage', 'status', 'restaurantCategoryId']
      },
      {
        model: User,
        as: 'user',
        attributes: ['firstName', 'email', 'avatar', 'userType']
      },
      {
        model: Product,
        as: 'products'
      }]
    })
    res.json(order)
  } catch (err) {
    res.status(500).send(err)
  }
}

const analytics = async function (req, res) {
  const yesterdayZeroHours = moment().subtract(1, 'days').set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
  const todayZeroHours = moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
  try {
    const numYesterdayOrders = await Order.count({
      where:
      {
        createdAt: {
          [Op.lt]: todayZeroHours,
          [Op.gte]: yesterdayZeroHours
        },
        restaurantId: req.params.restaurantId
      }
    })
    const numPendingOrders = await Order.count({
      where:
      {
        startedAt: null,
        restaurantId: req.params.restaurantId
      }
    })
    const numDeliveredTodayOrders = await Order.count({
      where:
      {
        deliveredAt: { [Op.gte]: todayZeroHours },
        restaurantId: req.params.restaurantId
      }
    })

    const invoicedToday = await Order.sum(
      'price',
      {
        where:
        {
          createdAt: { [Op.gte]: todayZeroHours }, // FIXME: Created or confirmed?
          restaurantId: req.params.restaurantId
        }
      })
    res.json({
      restaurantId: req.params.restaurantId,
      numYesterdayOrders,
      numPendingOrders,
      numDeliveredTodayOrders,
      invoicedToday
    })
  } catch (err) {
    res.status(500).send(err)
  }
}

const OrderController = {
  indexRestaurant,
  indexCustomer,
  create,
  update,
  destroy,
  confirm,
  send,
  deliver,
  show,
  analytics
}
export default OrderController
