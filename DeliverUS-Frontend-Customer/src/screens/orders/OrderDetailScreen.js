import React, { useEffect, useState } from 'react'
import { View, StyleSheet, FlatList } from 'react-native'
import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemibold'
import { getDetail } from '../../api/OrderEndpoints'
import { showMessage } from 'react-native-flash-message'
import { flashStyle, flashTextStyle } from '../../styles/GlobalStyles'

export default function OrderDetailScreen ({ route }) {
  const [order, setOrder] = useState(null)

  useEffect(() => {
    fetchOrder()
  }, [])

  const fetchOrder = async () => {
    try {
      const fetchedOrder = await getDetail(route.params.id)
      setOrder(fetchedOrder)
    } catch (error) {
      showMessage({
        message: `Error al obtener el pedido: ${error}`,
        type: 'danger',
        style: flashStyle,
        titleStyle: flashTextStyle
      })
    }
  }

  const renderItem = ({ item }) => {
    const name = item.name || 'Producto'
    const quantity = parseFloat(item.OrderProducts?.quantity) || 0
    const price = parseFloat(item.OrderProducts?.unityPrice) || 0
    const total = (price * quantity).toFixed(2)

    return (
      <View style={styles.itemRow}>
        <TextRegular>{name}</TextRegular>
        <TextRegular>{quantity} x {price.toFixed(2)}€</TextRegular>
        <TextRegular>= {total}€</TextRegular>
      </View>
    )
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <TextRegular>Cargando pedido...</TextRegular>
      </View>
    )
  }
  const total = (order.products || []).reduce((sum, p) => {
    const q = parseFloat(p.OrderProducts?.quantity) || 0
    const pr = parseFloat(p.OrderProducts?.unityPrice) || 0
    return sum + (q * pr)
  }, 0)

  return (
    <View style={styles.container}>
      <TextSemiBold style={styles.title}>Pedido #{order.id}</TextSemiBold>
      <TextRegular>Fecha: {new Date(order.createdAt).toLocaleDateString()}</TextRegular>
      <TextRegular>Estado: {order.status}</TextRegular>
      <TextRegular>Dirección: {order.address}</TextRegular>

      <FlatList
        data={order.products}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        style={{ marginTop: 20 }}
      />

<TextSemiBold style={styles.total}>
  Total: {total.toFixed(2)}€
</TextSemiBold>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1
  },
  title: {
    fontSize: 18,
    marginBottom: 10
  },
  itemRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#ccc'
  },
  itemTotal: {
    fontWeight: 'bold'
  },
  total: {
    marginTop: 20,
    fontSize: 16
  }
})
