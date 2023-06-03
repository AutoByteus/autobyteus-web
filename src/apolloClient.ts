import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client/core'

const cache = new InMemoryCache()

// graphql setup
const httpLink = createHttpLink({
    uri: `${import.meta.env.VITE_API_ENDPOINT}/graphql`
});


const apolloClient = new ApolloClient({
    cache,
    link: httpLink,
})

export default apolloClient