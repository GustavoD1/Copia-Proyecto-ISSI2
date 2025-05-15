import { get, post } from './helpers/ApiRequestsHelper'
function getAll () {
  return get('/orders')
}

function getDetail (id) {
  return get(`orders/${id}`)
}

function postOrder (order) {
  return post('/orders', order)
}
export { getAll, getDetail, postOrder }
