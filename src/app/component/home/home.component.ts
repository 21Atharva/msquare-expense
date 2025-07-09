import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from 'src/app/auth/auth.service';
import { BusinessDataService } from 'src/app/services/business-data.service';
import { AlertBoxComponent } from 'src/app/shared/alert-box/alert-box.component';
import { ProfileComponent } from 'src/app/shared/profile/profile.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  isLogging: any;
  app_version: any;
  userRole: string = '';

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

  onEmpDashboard() {
    this.businessData.onNavigate('emp-dashboard');
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
}
