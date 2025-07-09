import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BusinessDataService } from 'src/app/services/business-data.service';
import { AlertBoxComponent } from '../alert-box/alert-box.component';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  isEdit: boolean = false;
  isProcess: boolean = true;
  userId: string = '';
  editable: boolean = false;

  profilePicUrl: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  selectedFileName: string = '';

  expenseCount: number = 0;
  totalExpenseAmount: number = 0;

  employeeName: string = '';

  newName: string = '';
  newUsername: string = '';

  profile = {
    name: '',
    username: '',
    role: '',
    bio: '',
    points: 0,
    friends: 0,
    joinDate: '',
    gmail: '',
    status: '',
    imageUrl: ''
  };

  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(
    public businessData: BusinessDataService,
    public snackBar: MatSnackBar,
    private route: Router,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const id = localStorage.getItem('Id');

    if (!id || id.length !== 24) {
      this.snackBar.open('Session expired. Please log in again.', '', { duration: 3000 });
      this.route.navigate(['/login']);
      return;
    }

    this.userId = id;
    this.isProcess = true;

    this.businessData.getSaveDataById(this.userId).subscribe((res: any) => {
      setTimeout(() => {
        this.isProcess = false;
        this.editable = true;
        if (this.userId === environment.adminId) {
          this.editable = false;
        }
      }, 1000);

      const data = res.data;
      const joinDate = data.userFirstSignUp?.split('T')[0] || '';

      this.employeeName = data.name;
      this.profilePicUrl = data.profilePicName
        ? `http://localhost:3000/uploads/${data.profilePicName}`
        : null;

      this.expenseCount = data.expenses?.length || 0;
      this.totalExpenseAmount = data.expenses?.reduce((total: number, expense: any) => {
        return total + (Number(expense.amount) || 0);
      }, 0) || 0;

      this.profile = {
        name: data.name,
        username: data.username,
        bio: data.bio || 'No bio available',
        role: data.role,
        points: data.points || 1200,
        friends: data.friends || 25,
        joinDate: joinDate,
        gmail: data.gmail || '',
        status: data.status || '',
        imageUrl: data.profilePicName || ''
      };

      this.newName = data.name;
      this.newUsername = data.username;
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;

      const reader = new FileReader();
      reader.onload = () => {
        this.profilePicUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  editField(): void {
    this.isEdit = true;
  }

  saveData(): void {
    if (!this.userId) return;

    const formData = new FormData();
    formData.append('name', this.newName);
    formData.append('username', this.newUsername);
    formData.append('gmail', this.profile.gmail);

    if (this.selectedFile) {
      formData.append('profilePic', this.selectedFile);
    }

    this.businessData.updateWholeInfo(formData, this.userId).subscribe(
      (res: any) => {
        this.snackBar.open('Profile Updated Successfully', '', { duration: 2000 });
        this.isEdit = false;
        this.ngOnInit(); // Refresh data
      },
      error => {
        console.error(error);
        this.snackBar.open('Error updating profile', '', { duration: 2000 });
      }
    );
  }

  cancelEdit(): void {
    this.newName = this.profile.name;
    this.newUsername = this.profile.username;
    this.selectedFile = null;
    this.isEdit = false;
  }

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }

  // Navigation and Dialogs
  onDeleteAccount(): void {
    this.dialog.open(AlertBoxComponent, { data: { type: 'delete' } });
  }

  onProfile(): void {
    this.route.navigate(['profile']);
  }

  openDialog(): void {
    this.dialog.open(ProfileComponent, { width: '100px' });
  }

  onView(): void {
    this.route.navigate(['dashboard']);
  }

  onLogout(): void {
    this.dialog.open(AlertBoxComponent, { data: { type: 'alert' } });
  }

  onLeaveApplication(): void {
    this.businessData.onNavigate('leave-management');
  }

  onEmpDashboard(): void {
    this.businessData.onNavigate('admin-dashboard');
  }
}
