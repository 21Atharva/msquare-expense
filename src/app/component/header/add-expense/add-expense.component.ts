import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { BusinessDataService } from 'src/app/services/business-data.service';

@Component({
  selector: 'app-add-expense',
  templateUrl: './add-expense.component.html',
  styleUrls: ['./add-expense.component.scss'],
})
export class AddExpenseComponent implements OnInit {
  expenseForm!: FormGroup;
  
  isEdit = false;
  isCategoryNotFound = false;
  filled = true;
  date: any;
  showLoader = false;
  id: any;
  maxDate: any = new Date();
  selectedReceiptFileName: string = '';
  keywords: any = [];
  isSaving = false;
  payments: any = ['Card', 'Cash', 'UPI', 'Net Banking', 'Paypal'];
  @Input() tags: any = [];
  months: any = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  imageFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  constructor(
    public businessData: BusinessDataService,
    private _snackBar: MatSnackBar,
    private activateRoute: ActivatedRoute,
    public route: Router
  ) {}

  ngOnInit(): void {
    this.isSaving = false;
     this.showLoader = true;
    this.businessData.onGetAllCategory().subscribe((res: any) => {
      this.keywords = res.data;
    });

    this.expenseForm = new FormGroup({
      name: new FormControl('', [
        Validators.required,
        Validators.maxLength(50),
        Validators.pattern('^[a-zA-Z ]*$')
      ]),
        projectId: new FormControl ('', Validators.required),
  projectName: new FormControl('', Validators.required),
      amount: new FormControl('', Validators.required),
      expense_category: new FormControl('', Validators.required),
      payment: new FormControl('', Validators.required),
      expense_date: new FormControl('', Validators.required),
      comment: new FormControl(''),
    });

    this.activateRoute.paramMap.subscribe((param: ParamMap) => {
      if (param.has('id')) {
        this.isEdit = true;
        this.id = param.get('id');
        this.prePopulate();
      } else {
        this.isEdit = false;
         this.showLoader = false;
      }
    });
  }

  prePopulate() {
    this.showLoader = true;
    this.businessData.onGetSingleExpense(this.id).subscribe((res: any) => {
      let date = res.data.expense_date.toString().split(' ');
      let month = this.months.indexOf(date[1]);
      let day = parseInt(date[2]);
      let year = parseInt(date[3]);

      this.businessData.onGetAllCategory().subscribe((response: any) => {
        let index = response.data.indexOf(res.data.expense_category);
        this.isCategoryNotFound = index === -1;

        this.expenseForm.setValue({

          name: res.data.name,
          amount: res.data.amount,
          expense_date: new Date(year, month, day),
          expense_category: this.isCategoryNotFound ? 'Unassigned' : res.data.expense_category,
          payment: res.data.payment,
          comment: res.data.comment,
        });

        this.showLoader = false;
      });
    }, () => {
      this.showLoader = false;
    });
  }

  onReset() {
    this.expenseForm.reset();
    this.expenseForm.markAsUntouched();
    this.imageFile = null;
    this.imagePreview = null;
  }

  addEvent(event: any) {
    let str = event.value.toString();
    this.date = str.split(' ');
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.imageFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSaveExpense() {
    if (this.expenseForm.invalid) return;

    this.isSaving = true;
    const formData = new FormData();
    formData.append('projectId', this.expenseForm.value.projectId);
    formData.append('projectName', this.expenseForm.value.projectName);


    formData.append('name', this.expenseForm.value.name);
    formData.append('amount', this.expenseForm.value.amount);
    formData.append('expense_category', this.expenseForm.value.expense_category);
    formData.append('payment', this.expenseForm.value.payment);
    formData.append('expense_date', this.expenseForm.value.expense_date);
    formData.append('comment', this.expenseForm.value.comment);

    if (this.imageFile) {
      formData.append('receipt', this.imageFile);
    }

    this.businessData.onCreateExpenseWithImage(formData).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res.status === true) {
          this._snackBar.open('Expense Added with Image', '', { duration: 2000 });
          this.onReset();
        } else {
          this._snackBar.open('Error occurred! Please try again', '', { duration: 2000 });
        }
      },
      error: () => {
        this.isSaving = false;
        this._snackBar.open('Error while saving data', '', { duration: 2000 });
      }
    });
  }

  onEdit() {
    this.businessData.onUpdateExpense(this.id, this.expenseForm.value).subscribe((res) => {
      if (res) {
        this._snackBar.open('Expense Updated', '', { duration: 2000 });
      } else {
        this._snackBar.open('Error! Please try Again', '', { duration: 2000 });
      }
      this.route.navigate(['dashboard']);
    });
  }

  onCancel() {
    this.route.navigate(['dashboard']);
  }
}
