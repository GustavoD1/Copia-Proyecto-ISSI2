/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'
import { StyleSheet, View, FlatList } from 'react-native'
import TextSemiBold from '../../components/TextSemibold'
import TextRegular from '../../components/TextRegular'
import * as GlobalStyles from '../../styles/GlobalStyles' // Imported globally to practise a different import style unlike that of RestaurantDetailScreen
import { getAll } from '../../api/RestaurantEndpoints'
import restaurantLogo from '../../../assets/restaurantLogo.jpeg'
import productImage from '../../../assets/product.jpeg'
import { showMessage } from 'react-native-flash-message'
import { API_BASE_URL } from '@env'
import ImageCard from '../../components/ImageCard'
import { getPopularProducts } from '../../api/ProductEndpoints'

export default function RestaurantsScreen ({ navigation, route }) {
  // TODO: Create a state for storing the restaurants ||DONE
  const [restaurants, setRestaurants] = useState([])
  const [topProducts, setTopProducts] = useState([])

  useEffect(() => {
    // TODO: Fetch all restaurants and set them to state. ||DONE
  //      Notice that it is not required to be logged in.

    // TODO: set restaurants to state ||DONE
    async function fetchRestaurants () {
      try {
        const allRest = await getAll()
        setRestaurants(allRest)
      } catch (error) {
        showMessage({
          message: `There was an error while retrieving restaurants. ${error} `,
          type: 'error',
          style: GlobalStyles.flashStyle,
          titleStyle: GlobalStyles.flashTextStyle
        })
      }
    }
    fetchRestaurants()
  }, [route])

  useEffect(() => {
    async function fetchTopProducts (params) {
      try {
        const allP = await getPopularProducts()
        setTopProducts(allP)
      } catch (error) {
        showMessage({
          message: `There was an error while retrieving top products. ${error} `,
          type: 'error',
          style: GlobalStyles.flashStyle,
          titleStyle: GlobalStyles.flashTextStyle
        })
      }
    }
    fetchTopProducts()
  }, [route])

  const renderTopProducts = () => {
    return (
      <View>
      <TextSemiBold style={{ fontSize: 19, marginHorizontal: 10 }}>Top products from all restaurants: </TextSemiBold>
      <View style= {[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
        {topProducts.map((item, index) =>
          <View key={index} style={{ marginHorizontal: 35, width: 250 }}>
            <ImageCard
              imageUri={item.image ? { uri: API_BASE_URL + '/' + item.image } : productImage}
              title={item.name}
          >
              <TextSemiBold>De: <TextRegular>{item.restaurant.name}</TextRegular></TextSemiBold>
            </ImageCard>
          </View>
        )

        }
      </View>
    </View>
    )
  }

  // Muestra el restaurante
  const renderRestaurant = ({ item }) => {
    return (
     <ImageCard
       imageUri={item.logo ? { uri: API_BASE_URL + '/' + item.logo } : restaurantLogo}
       title={item.name}
       onPress={() => {
         navigation.navigate('RestaurantDetailScreen', { id: item.id })
       }}
     >
       <TextRegular numberOfLines={2}>{item.description}</TextRegular>
       {item.averageServiceMinutes !== null &&
         <TextSemiBold>Avg. service time: <TextSemiBold textStyle={{ color: GlobalStyles.brandPrimary }}>{item.averageServiceMinutes} min.</TextSemiBold></TextSemiBold>
       }
       <TextSemiBold>Shipping: <TextSemiBold textStyle={{ color: GlobalStyles.brandPrimary }}>{item.shippingCosts.toFixed(2)}€</TextSemiBold></TextSemiBold>
     </ImageCard>
    )
  }

  const renderEmptyRestaurantsList = () => {
    return (
     <TextRegular textStyle={styles.emptyList}>
       No restaurants were retreived.
     </TextRegular>
    )
  }

  return (
   <FlatList
     style={styles.container}
     ListHeaderComponent={renderTopProducts}
     data={restaurants}
     renderItem={renderRestaurant}
     keyExtractor={item => item.id.toString()}
     ListEmptyComponent={renderEmptyRestaurantsList}
   />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  button: {
    borderRadius: 8,
    height: 40,
    margin: 12,
    padding: 10,
    width: '100%'
  },
  text: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center'
  },
  emptyList: {
    textAlign: 'center',
    padding: 50
  }
})
