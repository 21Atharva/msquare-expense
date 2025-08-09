import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { BusinessDataService } from 'src/app/services/business-data.service';
import { AlertBoxComponent } from 'src/app/shared/alert-box/alert-box.component';
import { ProfileComponent } from 'src/app/shared/profile/profile.component';
import { LayoutConfig } from 'src/app/shared/layout/layout.interface';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  isLoading: boolean = true;
  app_version: any;
  userRole: string = '';
  layoutConfig!: LayoutConfig;

  constructor(
    private route: Router,
    public dialog: MatDialog,
    public authService: AuthService,
    public businessData: BusinessDataService
  ) {
    this.app_version = sessionStorage.getItem('Version');
  }

  ngOnInit(): void {
    this.userRole = localStorage.getItem('role') || '';

    // Reduced loading time for better UX - no need for long artificial delay
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
    }, 0); // Reduced from 4000ms to 300ms

     const token = localStorage.getItem('LEAD_ID');
    const userId = localStorage.getItem('Id');

    if (!token || !userId || userId.length !== 24) {
      this.authService.onLogout();
      return;
    }

    this.authService.authAfterReferesh(true, token); // ✅ safe use
    this.setupLayoutConfig();
  }

  openDialog(): void {
    this.dialog.open(ProfileComponent, {
      width: '600px',
    });
  }

  onView(): void {
    this.route.navigate(['dashboard']);
  }

  onProfile(): void {
    this.dialog.open(ProfileComponent, {
      width: '600px',
    });
  }

  onLogout(): void {
    this.dialog.open(AlertBoxComponent, {
      data: { type: 'alert' }
    });
  }

  onLeaveApplication(): void {
    this.businessData.onNavigate('leave-application');
  }

  onLeaveManagement(): void {
    this.businessData.onNavigate('leave-management');
  }

  onEmpDashboard() {
    this.businessData.onNavigate('emp-dashboard');
  }

  onadminDashboard() {
    this.businessData.onNavigate('admin-dashboard');
  }

  onPendingApprovals(): void {
    this.businessData.onNavigate('pending-approvals');
  }

  onAdd() {
    this.businessData.onNavigate('home');
  }

  private setupLayoutConfig() {
    const employeeNavigationItems = [
      { label: 'Profile', icon: 'perm_identity', action: () => this.onProfile(), isActive: () => false },
      { label: 'View Expenses', icon: 'bar_chart', action: () => this.onView(), isActive: () => false },
      { label: 'Add Expenses', icon: 'add', action: () => this.onAdd(), isActive: () => true },
      { label: 'Leave Application', icon: 'event_note', action: () => this.onLeaveApplication(), isActive: () => false },
      { label: 'Leave Dashboard', icon: 'dashboard', action: () => this.onEmpDashboard(), isActive: () => false },
      { label: 'Logout', icon: 'logout', action: () => this.onLogout(), isActive: () => false }
    ];

    const adminNavigationItems = [
      { label: 'Profile', icon: 'perm_identity', action: () => this.onProfile(), isActive: () => false },
      { label: 'View Expenses', icon: 'bar_chart', action: () => this.onView(), isActive: () => false },
      { label: 'Add Expenses', icon: 'add', action: () => this.onAdd(), isActive: () => true },
      { label: 'Pending Approvals', icon: 'approval', action: () => this.onPendingApprovals(), isActive: () => false },
      { label: 'Employee Leaves', icon: 'assignment', action: () => this.onLeaveManagement(), isActive: () => false },
      { label: 'Admin Dashboard', icon: 'dashboard', action: () => this.onadminDashboard(), isActive: () => false },
      { label: 'Logout', icon: 'logout', action: () => this.onLogout(), isActive: () => false }
    ];

    const managerNavigationItems = [
      { label: 'Profile', icon: 'perm_identity', action: () => this.onProfile(), isActive: () => false },
      { label: 'View Expenses', icon: 'bar_chart', action: () => this.onView(), isActive: () => false },
      { label: 'Add Expenses', icon: 'add', action: () => this.onAdd(), isActive: () => true },
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
