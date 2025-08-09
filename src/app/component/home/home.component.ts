import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from 'src/app/auth/auth.service';
import { BusinessDataService } from 'src/app/services/business-data.service';
import { AlertBoxComponent } from 'src/app/shared/alert-box/alert-box.component';
import { ProfileComponent } from 'src/app/shared/profile/profile.component';
import { LayoutConfig } from 'src/app/shared/layout/layout.interface';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  isLogging: any;
  app_version: any;
  userRole: string = '';
  layoutConfig!: LayoutConfig;

  constructor(
    public dialog: MatDialog,
    public authService: AuthService,
    public businessData: BusinessDataService,
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('Id');

    if (!token || !userId || userId.length !== 24) {
      this.authService.onLogout();
      return;
    }

    this.authService.authAfterReferesh(true, token); // ✅ safe call
    this.app_version = sessionStorage.getItem('Version');
    this.userRole = localStorage.getItem('role') || '';
    this.setupLayoutConfig();
  }

  onAdd() {
    this.businessData.onNavigate('home');
  }

  onLeaveApplication() {
    this.businessData.onNavigate('leave-application');
  }

  onLeaveManagement() {
    this.businessData.onNavigate('leave-management');
  }

  onAdminDashboard() {
    this.businessData.onNavigate('admin-dashboard');
  }

  onPendingApprovals() {
    this.businessData.onNavigate('pending-approvals');
  }

  onEmpDashboard() {
    this.businessData.onNavigate('emp-dashboard');
  }

  onDashboard() {
    this.businessData.onNavigate('dashboard');
  }

  Profile() {
    this.openDialog();
  }

  openDialog(): void {
    this.dialog.open(ProfileComponent, {
      width: '600px',
    });
  }

  onLogout() {
    this.dialog.open(AlertBoxComponent, {
      data: { type: 'alert' },
    });
  }

  onGithub() {
    this.businessData.onGithub();
  }

  onLinkedin() {
    this.businessData.onLinkedin();
  }

  private setupLayoutConfig() {
    const employeeNavigationItems = [
      { label: 'Profile', icon: 'perm_identity', action: () => this.Profile(), isActive: () => false },
      { label: 'View Expenses', icon: 'bar_chart', action: () => this.onDashboard(), isActive: () => true },
      { label: 'Add Expenses', icon: 'add', action: () => this.onAdd(), isActive: () => false },
      { label: 'Leave Application', icon: 'event_note', action: () => this.onLeaveApplication(), isActive: () => false },
      { label: 'Leave Dashboard', icon: 'dashboard', action: () => this.onEmpDashboard(), isActive: () => false },
      { label: 'Logout', icon: 'logout', action: () => this.onLogout(), isActive: () => false }
    ];

    const adminNavigationItems = [
      { label: 'Profile', icon: 'perm_identity', action: () => this.Profile(), isActive: () => false },
      { label: 'View Expenses', icon: 'bar_chart', action: () => this.onDashboard(), isActive: () => true },
      { label: 'Add Expenses', icon: 'add', action: () => this.onAdd(), isActive: () => false },
      { label: 'Pending Approvals', icon: 'approval', action: () => this.onPendingApprovals(), isActive: () => false },
      { label: 'Employee Leaves', icon: 'assignment', action: () => this.onLeaveManagement(), isActive: () => false },
      { label: 'Admin Dashboard', icon: 'dashboard', action: () => this.onAdminDashboard(), isActive: () => false },
      { label: 'Logout', icon: 'logout', action: () => this.onLogout(), isActive: () => false }
    ];

    const managerNavigationItems = [
      { label: 'Profile', icon: 'perm_identity', action: () => this.Profile(), isActive: () => false },
      { label: 'View Expenses', icon: 'bar_chart', action: () => this.onDashboard(), isActive: () => true },
      { label: 'Add Expenses', icon: 'add', action: () => this.onAdd(), isActive: () => false },
      { label: 'Leave Dashboard', icon: 'dashboard', action: () => this.onEmpDashboard(), isActive: () => false },
      { label: 'Leave Application', icon: 'event_note', action: () => this.onLeaveApplication(), isActive: () => false },
      { label: 'Manage Employee Leaves', icon: 'assignment', action: () => this.onLeaveManagement(), isActive: () => false },
      { label: 'Logout', icon: 'logout', action: () => this.onLogout(), isActive: () => false }
    ];

    let navigationItems;
    if (this.userRole === 'admin') {
      navigationItems = adminNavigationItems;
    } else if (this.userRole === 'manager') {
      navigationItems = managerNavigationItems;
    } else {
      navigationItems = employeeNavigationItems;
    }

    this.layoutConfig = {
      title: 'Msquare Portal',
      logoPath: '../../../../assets/image/msquare.png',
      navigationItems: navigationItems,
      userRole: this.userRole
    };
  }
}
