import Vue from 'vue';
import Router from 'vue-router';
import CloseBuy from '@/pages/CloseBuy';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'CloseBuy',
      component: CloseBuy
    }
  ]
});
