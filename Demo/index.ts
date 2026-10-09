import usersData from './Users/users.json'
import contactsData from './Contacts/contacts.json'
import productsData from './Products/products.json'
import productCategoryData from './ProductCategory/productCategory.json'
import customersData from './Customers/customers.json'

export const demo = {
  users: usersData,
  contacts: contactsData,
  products: productsData,
  productCategory: productCategoryData,
  customers: customersData,
}

export const demoApi = {
  users: '/api/demo/users',
  contacts: '/api/demo/contacts',
  products: '/api/demo/products',
  productCategory: '/api/demo/products',
  customers: '/api/demo/customers',
}

export { default as users } from './Users/users.json'
export { default as contacts } from './Contacts/contacts.json'
export { default as products } from './Products/products.json'
export { default as productCategory } from './ProductCategory/productCategory.json'
export { default as customers } from './Customers/customers.json'
