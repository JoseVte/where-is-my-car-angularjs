import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guard/auth.guard';

/** Every page is lazy: the initial bundle only has the app shell, the guards and Firebase Auth. */
export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./layout/public-layout/public-layout').then((m) => m.PublicLayout),
        canActivate: [guestGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./component/home/home').then((m) => m.Home)
            },
            {
                path: 'login',
                loadComponent: () => import('./component/login/login').then((m) => m.Login)
            },
            {
                path: 'register',
                loadComponent: () => import('./component/login/login').then((m) => m.Login)
            }
        ]
    },
    {
        path: '',
        // The map (Leaflet) is only downloaded once signed in
        loadComponent: () => import('./layout/app-layout/app-layout').then((m) => m.AppLayout),
        canActivate: [authGuard],
        children: [
            {
                path: 'map',
                loadComponent: () => import('./component/explore/explore').then((m) => m.Explore),
                title: 'map'
            },
            {
                path: 'history',
                loadComponent: () => import('./component/history/history').then((m) => m.History),
                title: 'history'
            },
            {
                path: 'categories',
                loadComponent: () => import('./component/category-list/category-list').then((m) => m.CategoryList),
                title: 'manage_categories'
            },
            {
                path: 'categories/new',
                loadComponent: () => import('./component/edit-category/edit-category').then((m) => m.EditCategory),
                title: 'add_new_category'
            },
            {
                path: 'categories/:id/edit',
                loadComponent: () => import('./component/edit-category/edit-category').then((m) => m.EditCategory),
                title: 'edit_category'
            },
            {
                path: 'settings',
                loadComponent: () => import('./component/settings/settings').then((m) => m.Settings),
                title: 'settings'
            },
            {
                path: 'settings/profile',
                loadComponent: () => import('./component/edit-profile/edit-profile').then((m) => m.EditProfile),
                title: 'web_edit_profile'
            },
            {
                path: 'locations/:id',
                loadComponent: () => import('./component/location-details/location-details').then((m) => m.LocationDetails),
                title: 'saved_location_default'
            },
            {
                path: 'locations/:id/edit',
                loadComponent: () => import('./component/edit-location/edit-location').then((m) => m.EditLocation),
                title: 'edit_location'
            }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
