import React, { useEffect, useState } from 'react'
import { StyleSheet, View, FlatList } from 'react-native'
import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemibold'
import { getAll } from '../../api/OrderEndpoints'
import ImageCard from '../../components/ImageCard'
import { API_BASE_URL } from '@env'
import restaurantLogo from '../../../assets/restaurantLogo.jpeg'

export default function OrdersScreen ({ navigation }) {
  const [orders, setOrders] = useState([])
  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const fetchedOrders = await getAll()
      const confirmedOrders = fetchedOrders.sort(function (a, b) { return b.id - a.id })
      setOrders(confirmedOrders)
    } catch (error) {
      console.error('Error fetching orders', error)
    }
  }

  const renderOrder = ({ item }) => (
    <ImageCard
           imageUri={item.logo ? { uri: API_BASE_URL + '/' + item.logo } : restaurantLogo}
           title={item.name}
           onPress={() => {
             navigation.navigate('OrderDetailScreen', { id: item.id })
           }}
         >
         <TextSemiBold>Order: <TextRegular>{item.id}</TextRegular></TextSemiBold>
         <TextSemiBold>Precio Total: <TextRegular>{item.price + item.shippingCosts}€</TextRegular></TextSemiBold>

         </ImageCard>
  )
  return (
    <View style={styles.container}>
    <TextSemiBold style={styles.title}>Mis pedidos confirmados</TextSemiBold>
    <FlatList
      data={orders}
      renderItem={renderOrder}
      keyExtractor={item => item.id.toString()}
      ListEmptyComponent={<TextRegular>No hay pedidos confirmados.</TextRegular>}
    />
  </View>
  )
}

const styles = StyleSheet.create({
  FRHeader: { // TODO: remove this style and the related <View>. Only for clarification purposes
    justifyContent: 'center',
    alignItems: 'left',
    margin: 50
  },
  container: {
    flex: 1,
    margin: 35
  },
  button: {
    borderRadius: 8,
    height: 60,
    margin: 12,
    padding: 20,
    flex: 1,
    width: 300
  },
  text: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center'
  }
})
