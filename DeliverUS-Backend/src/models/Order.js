import { Model } from 'sequelize'
const loadModel = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      const OrderProducts = sequelize.define('OrderProducts', {
        quantity: DataTypes.INTEGER,
        unityPrice: DataTypes.DOUBLE
      })

      Order.belongsTo(models.Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' })
      Order.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
      Order.belongsToMany(models.Product, { as: 'products', through: OrderProducts }, { onDelete: 'cascade' })
    }

    getStatus () {
      if (this.deliveredAt) { return 'delivered' }
      if (this.sentAt) { return 'sent' }
      if (this.startedAt) { return 'in process' }
      return 'pending'
    }
  }
  Order.init({
    createdAt: DataTypes.DATE,
    startedAt: DataTypes.DATE,
    sentAt: DataTypes.DATE,
    deliveredAt: DataTypes.DATE,
    price: DataTypes.DOUBLE,
    address: DataTypes.STRING,
    shippingCosts: DataTypes.DOUBLE,
    restaurantId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    status: {
      type: DataTypes.VIRTUAL,
      get () {
        return this.getStatus()
      }
    }
  }, {
    sequelize,
    modelName: 'Order'
  })

  Order.afterDestroy(async (order, options) => {
    const orders = await Order.findAll({ order: [['id', 'ASC']] }) // Obtener todos los pedidos ordenados por ID
    let currentId = 1

    for (const o of orders) {
      await o.update({ id: currentId }) // Actualizar el ID de cada pedido
      currentId++
    }

    // Reiniciar el contador de AUTO_INCREMENT en la tabla
    await sequelize.query('ALTER TABLE Orders AUTO_INCREMENT = ?', {
      replacements: [currentId]
    })
  })

  return Order
}
export default loadModel
