import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { AddExpenseComponent } from './component/header/add-expense/add-expense.component';
import { LeaveApplicationComponent } from './component/header/leave-application/leave-application.component';
import { EmployeeDashboardComponent } from './component/header/employee-dashboard/employee-dashboard.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { LoginComponent } from './component/welcome/login/login.component';
import { WelcomeComponent } from './component/welcome/welcome.component';
import { LeaveManagementComponent } from './leave-management/leave-management.component';
import { ProfileComponent } from './shared/profile/profile.component';

const routes: Routes = [
  {
    path:'home',
    loadChildren:()=>import('./component/header/header.module').then((m)=>m.HeaderModule),
  },

  {
    path:'welcome',
    loadChildren:()=>import('./component/welcome/welcome.module').then((m)=>m.WelcomeModule),
  },

  {
    path:'edit/:id',
    component:AddExpenseComponent,
    canActivate:[AuthGuard],
    title:'Edit Expense | ExpenseTracker'
  },
  
  {
    path:'dashboard',
    loadChildren:()=>import("./component/home/home.module").then((m)=>m.HomeModule),
  },

  {
  path: 'leave-application',
  component: LeaveApplicationComponent
  },
  {
  path: 'emp-dashboard',
  component: EmployeeDashboardComponent
  },
  {
  path: 'admin-dashboard',
  component: AdminDashboardComponent
  },
   {
  path: 'welcome',
  component: WelcomeComponent
  },
   {
  path: 'leave-management',
  component: LeaveManagementComponent
  },

  {
  path: 'profile',
  component: ProfileComponent
  },
  
  
  {path:'**', redirectTo:'welcome'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers:[AuthGuard]
})
export class AppRoutingModule { }
