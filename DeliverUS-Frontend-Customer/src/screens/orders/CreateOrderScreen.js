import React, { useContext, useEffect, useState } from 'react'
import { StyleSheet, View, FlatList, Pressable } from 'react-native'
import { showMessage } from 'react-native-flash-message'
import { getDetail } from '../../api/RestaurantEndpoints'
import ImageCard from '../../components/ImageCard'
import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemibold'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import defaultProductImage from '../../../assets/product.jpeg'
import { API_BASE_URL } from '@env'
import * as GlobalStyles from '../../styles/GlobalStyles'
import Counter from '../../components/Counter'
import { postOrder } from '../../api/OrderEndpoints'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import InputItem from '../../components/InputItem'
import { Formik } from 'formik'
import * as yup from 'yup'
import TextError from '../../components/TextError'

export default function CreateOrderScreen ({ route, navigation }) {
  const [restaurant, setRestaurant] = useState([])
  const [pedido, setPedido] = useState({})
  const [resetCounters, setResetCounters] = useState(false)
  const { loggedInUser } = useContext(AuthorizationContext)
  const initialValues = { address: null }
  const [backendErrors, setBackendErrors] = useState()

  useEffect(() => {
    async function fetchedRestaurant () {
      try {
        const fetchedRestaurant = await getDetail(route.params.restaurantId)
        setRestaurant(fetchedRestaurant)
      } catch (error) {
        showMessage({
          message: `There was an error while retrieving restaurant details (id ${route.params.id}). ${error}`,
          type: 'error',
          style: GlobalStyles.flashStyle,
          titleStyle: GlobalStyles.flashTextStyle
        })
      }
    }
    if (loggedInUser) {
      fetchedRestaurant()
    } else {
      setRestaurant(null)
      showMessage({
        message: 'You must be logged in to create an order.',
        type: 'warning',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }, [route, loggedInUser])

  const renderProduct = ({ item }) => {
    return (
        <ImageCard
          imageUri={item.image ? { uri: API_BASE_URL + '/' + item.image } : defaultProductImage}
          title={item.name}
        >
          <TextRegular numberOfLines={2}>{item.description}</TextRegular>
          <TextSemiBold textStyle={styles.price}>{item.price.toFixed(2)}€</TextSemiBold>
          {item.availability && <Counter id={item.id} cambioCantidad={handleQuantityChange} reset={resetCounters} cantidad={0}/>}
          {!item.availability &&
            <TextRegular textStyle={styles.availability }>Not available</TextRegular>
          }
        </ImageCard>
    )
  }

  const renderEmptyProductsList = () => {
    return (
        <TextRegular textStyle={styles.emptyList}>
          This restaurant has no products.
        </TextRegular>
    )
  }

  const renderFooter = () => {
    return (
        <View>
          {backendErrors &&
           backendErrors.map((error, index) => <TextError key={index}>{error.msg}</TextError>)
          }
          <Formik initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={(values) => createOrder(values)}>
            {({ setFieldValue, values, handleSubmit }) => (
              <View>
              <InputItem
                 name= 'address'
                 label='Direccion de entrega'
                 value={values.address}
                 onChangeText={(text) => setFieldValue('address', text)}
                />
                <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
                  <Pressable
                    onPress={ handleSubmit }
                    style={({ pressed }) => [
                      {
                        backgroundColor: pressed
                          ? '#008f39' // Color que tiene el boton cuando es presionado
                          : '#76FF7A' // Color que tiene el boton si no esta presionado
                      },
                      styles.button
                    ]}
                  >
                      <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
                        <MaterialCommunityIcons name='content-save' color={'white'} size={20}/>
                        <TextRegular textStyle={styles.text}>
                         Save
                        </TextRegular>
                      </View>
                  </Pressable>
                </View>
              </View>
            )
            }
          </Formik>
      <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }]}>
      <Pressable
          onPress={eraseOrder}
          style={({ pressed }) => [
            {
              backgroundColor: pressed
                ? GlobalStyles.brandGreenTap
                : '#fe0000'
            },
            styles.button
          ]}
        >
          <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
            <MaterialCommunityIcons name='delete' color={'white'} size={20}/>
            <TextRegular textStyle={styles.text}>
                 Erase
            </TextRegular>
          </View>
        </Pressable>
      </View>
        </View>
    )
  }

  // Crear el pedido a partir de los datos de los botones y poner las cantidades a 0 al darle a erase
  const handleQuantityChange = (id, quantity) => {
    setPedido(prev => ({
      ...prev,
      [id]: quantity
    }))
  }

  const createOrder = (values) => {
    const selectedProducts = Object.entries(pedido)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => ({
        productId: parseInt(id),
        quantity: qty
      }))

    if (selectedProducts.length === 0 || !values.address) {
      showMessage({
        message: 'You must select at least one product. And must have a valid adress',
        type: 'warning',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
      return
    }

    const orderData = {
      address: values.address.toString(),
      restaurantId: restaurant.id,
      products: selectedProducts
    }
    try {
      postOrder(orderData)
      showMessage({
        message: 'Order succesfully created',
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
      setTimeout(() => { navigation.navigate('OrdersScreen', { dirty: true }) }, 100)
    } catch (error) {
      console.log(error)
      setBackendErrors(error.errors)
    }
  }

  const eraseOrder = () => {
    setPedido({})
    setResetCounters(prev => !prev)
  }

  return (
        <FlatList
            ListEmptyComponent={renderEmptyProductsList}
            style={styles.container}
            data={restaurant.products}
            renderItem={renderProduct}
            keyExtractor={item => item.id.toString()}
            ListFooterComponent={renderFooter}
          />
  )
}

const styles = StyleSheet.create({
  FRHeader: { // TODO: remove this style and the related <View>. Only for clarification purposes
    justifyContent: 'center',
    alignItems: 'left',
    margin: 50
  },
  container: {
    flex: 1
  },
  row: {
    padding: 15,
    marginBottom: 5,
    backgroundColor: GlobalStyles.brandSecondary
  },
  restaurantHeaderContainer: {
    height: 250,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'column',
    alignItems: 'center'
  },
  imageBackground: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center'
  },
  image: {
    height: 100,
    width: 100,
    margin: 10
  },
  description: {
    color: 'white'
  },
  textTitle: {
    fontSize: 20,
    color: 'white'
  },
  emptyList: {
    textAlign: 'center',
    padding: 50
  },
  button: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    width: '80%'
  },
  text: {
    fontSize: 16,
    color: 'white',
    alignSelf: 'center',
    marginLeft: 5
  },
  availability: {
    textAlign: 'right',
    marginRight: 5,
    color: GlobalStyles.brandSecondary
  },
  actionButton: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    margin: '1%',
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'column',
    width: '50%'
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    bottom: 5,
    position: 'absolute',
    width: '90%'
  }
})

const validationSchema = yup.object().shape({
  address: yup.string().max(255, 'Address is too long').required('Adress is required')
})
