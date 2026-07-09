import Main from 'src/layouts/Main.vue'
import IndexPage from 'src/pages/IndexPage.vue'

export default [
  {
    path: '/',
    component: Main,
    children: [
      {
        path: '',
        component: IndexPage,
      },
    ],
  },
]
