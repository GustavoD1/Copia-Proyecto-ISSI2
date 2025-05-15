import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export default function Counter ({ id, cambioCantidad, reset, cantidad = 0 }) {
  const [count, setCount] = useState(cantidad)

  useEffect(() => {
    setCount(0)
  }, [reset])

  const increase = () => {
    const newCount = count + 1
    setCount(newCount)
    cambioCantidad(id, newCount)
  }

  const decrease = () => {
    if (count > 0) {
      const newCount = count - 1
      setCount(newCount)
      cambioCantidad(id, newCount)
    }
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={decrease}>
        <MaterialCommunityIcons name="minus-circle-outline" size={24} color="#333" />
      </Pressable>
      <Text style={styles.counter}>{count}</Text>
      <Pressable onPress={increase}>
        <MaterialCommunityIcons name="plus-circle-outline" size={24} color="#333" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginTop: 10
  },
  counter: {
    marginHorizontal: 10,
    fontSize: 16
  }
})
