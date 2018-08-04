import Vue from 'vue';
import Router from 'vue-router';
import Home from './home/home';
import Transfer from './transfer/transfer';
import Chat from './chat/chat';

Vue.use(Router);

export default new Router({
  routes:[
    {
      path: '/',
      name: 'home',
      component: Home,
      children: [
        {
          path: 'transfer',
          name: 'transfer',
          component: Transfer,
        },
        {
          path: 'chat',
          name: 'chat',
          component: Chat,
        }
      ]
    }
  ]
});
