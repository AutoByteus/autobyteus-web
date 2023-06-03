import { createApp, h, provide } from 'vue';
import App from './App.vue'
import { DefaultApolloClient } from '@vue/apollo-composable'

import apolloClient from './apolloClient';


const app = createApp({
    setup() {
        provide(DefaultApolloClient, apolloClient)
    },
    render: () => h(App),
})

app.mount('#app');
