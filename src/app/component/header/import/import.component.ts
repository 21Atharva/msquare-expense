import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BusinessDataService } from 'src/app/services/business-data.service';
import { AlertBoxComponent } from 'src/app/shared/alert-box/alert-box.component';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.scss'],
})
export class ImportComponent implements OnInit {
  isCorrect: boolean = false;
  displayedColumns: string[] = [
    'name',
    'amount',
    'date',
    'category',
    'payment',
    'comment',
    'projectId',
    'projectName',
  ];
  dataSource: any = [
    {
      name: '',
      amount: '',
      date: '',
      category: '',
      payment: '',
      comment: '',
      projectId: '',
      projectName: '',
    },
  ];
  propertyNames: string[] = [];
  dataRows: string[] = [];
  csvRecords: any;
  header: boolean = false;
  importedCount: number = 0;
  
  constructor(
    public route: Router, 
    public dialog: MatDialog,
    public snackBar: MatSnackBar,
    public businessData: BusinessDataService,
    private authService: AuthService
  ) {}
  ngOnInit(): void {}

  onView() {
    this.route.navigate(['dashboard']);
  }



  onSaveImport() {
    // Check authentication before starting import
    if (!this.authService.getIsAuth()) {
      this.snackBar.open('You must be logged in to import expenses', '', {duration: 4000});
      this.route.navigate(['']);
      return;
    }

    const token = this.authService.getToken();
    const userId = this.businessData.getUserIdFromSS();
    
    console.log('🔍 Pre-Import Authentication Check:');
    console.log('  isAuth:', this.authService.getIsAuth());
    console.log('  Token exists:', !!token);
    console.log('  Token value:', token ? `${token.substring(0, 20)}...` : 'null');
    console.log('  User ID:', userId);
    console.log('  localStorage token:', localStorage.getItem('token') ? 'exists' : 'null');
    console.log('  localStorage Id:', localStorage.getItem('Id'));
    
    if (!token || !userId) {
      this.snackBar.open('Authentication error. Please log in again.', '', {duration: 4000});
      this.route.navigate(['']);
      return;
    }

    console.log('🔍 Import Debug Info:');
    console.log('  Token exists:', !!token);
    console.log('  User ID:', userId);
    console.log('  Rows to import:', this.csvRecords.length - 1);

    this.propertyNames = this.csvRecords[0];
    this.importedCount = 0;
    
    let hashamp:any={};
    let name:boolean=false;
    let amount:boolean=false;
    let expense_date:boolean=false;
    let expense_category:boolean=false;
    let payment_type:boolean=false;
    let comment:boolean=false;
    let projectId:boolean=false;
    let projectName:boolean=false;

    for(let j=1;j<this.csvRecords.length-1;j++)
    {
      hashamp={};
      name=false;
      amount=false;
      expense_category=false;
      expense_date=false;
      payment_type=false;
      comment=false;
      projectId=false;
      projectName=false;
      
      for(let i=0;i<this.propertyNames.length;i++)
      {
        // Fix: Actually assign the lowercase value back
        let columnName = this.propertyNames[i].toLowerCase().trim();
        
        // Fix: Better field name matching including our CSV headers
        if(columnName === 'name' || columnName === 'expense_name' || columnName === 'expense name'){
          if(this.csvRecords[j][i] &&(this.csvRecords[j][i]!='' || this.csvRecords[j][i]!=' ')){
          hashamp['expense_name']=this.csvRecords[j][i].trim();
          name=true;
          }
        }
        else if(columnName === 'amount' || columnName === 'amounts'){
          if(this.csvRecords[j][i] &&(this.csvRecords[j][i]!='' || this.csvRecords[j][i]!=' ')){
            hashamp['amount']=parseFloat(this.csvRecords[j][i]);
            amount=true;
          }
        }
        else if(columnName === 'expense date' || columnName === 'date' || columnName === 'expense_date'){
          if(this.csvRecords[j][i] &&(this.csvRecords[j][i]!='' || this.csvRecords[j][i]!=' ')){
          hashamp['expense_date']=this.csvRecords[j][i].trim();
          expense_date=true;
          }
        }
        else if(columnName === 'payment' || columnName === 'payment_type' || columnName === 'payment type'){
          if(this.csvRecords[j][i] &&(this.csvRecords[j][i]!='' || this.csvRecords[j][i]!=' ')){
          hashamp['payment_type']=this.csvRecords[j][i].trim();
          payment_type=true;
          }
        }
        else if(columnName === 'expense_category' || columnName === 'expense category' || columnName === 'category'){
          if(this.csvRecords[j][i] &&(this.csvRecords[j][i]!='' || this.csvRecords[j][i]!=' ')){
          hashamp['expense_category']=this.csvRecords[j][i].trim();
          expense_category=true;
          }
        }
        else if(columnName === 'comments' || columnName === 'comment'){
          if(this.csvRecords[j][i] &&(this.csvRecords[j][i]!='' || this.csvRecords[j][i]!=' ')){
          hashamp['comment']=this.csvRecords[j][i].trim();
          comment=true;
          }
        }
        else if(columnName === 'project id' || columnName === 'projectid' || columnName === 'project_id'){
          if(this.csvRecords[j][i] &&(this.csvRecords[j][i]!='' || this.csvRecords[j][i]!=' ')){
          hashamp['projectId']=this.csvRecords[j][i].trim();
          projectId=true;
          }
        }
        else if(columnName === 'project name' || columnName === 'projectname' || columnName === 'project_name'){
          if(this.csvRecords[j][i] &&(this.csvRecords[j][i]!='' || this.csvRecords[j][i]!=' ')){
          hashamp['projectName']=this.csvRecords[j][i].trim();
          projectName=true;
          }
        }
      }
      
      if(!name || !amount || !expense_date){
        this.snackBar.open('Please Mention required Fields Properly in row ' + (j+1),'',{duration:3000});
        return;
      }
      
      // Validate date format
      let dateParts = hashamp['expense_date'].split('/');
      if(dateParts.length !== 3 || dateParts[2].length !== 4){
        this.snackBar.open('Date Format should be DD/MM/YYYY in row ' + (j+1),'',{duration:3000});
        return;
      }
      if(parseInt(dateParts[1])>12 || parseInt(dateParts[1])<1){
        this.snackBar.open('Invalid month in date format (row ' + (j+1) + ')','',{duration:3000});
        return;
      }
      if(parseInt(dateParts[0])>31 || parseInt(dateParts[0])<1){
        this.snackBar.open('Invalid day in date format (row ' + (j+1) + ')','',{duration:3000});
        return;
      }
      
      if(!expense_category){
        hashamp['expense_category']='Unassigned';
      }
      if(!payment_type){
        hashamp['payment_type']='Card';
      }
      if(!comment){
        hashamp['comment']='Imported Expense';
      }
      if(!projectId){
        hashamp['projectId']='IMPORT';
      }
      if(!projectName){
        hashamp['projectName']='CSV Import';
      }
      
      // Add a small delay between imports to prevent overwhelming the server
      setTimeout(() => {
        this.onSaveExpense(hashamp, j);
      }, j * 500); // 500ms delay between each import
    }
  }

  onSaveExpense(body:any, rowIndex: number) {
    console.log(`🔍 Importing row ${rowIndex + 1}:`, body);
    
    this.businessData
      .onImportExpense(body)
      .subscribe((res: any) => {
        if (res.status === true) {
          this.importedCount++;
          console.log(`✅ Row ${rowIndex + 1} imported successfully`);
          
          // Check if this is the last row to show final success message
          if(rowIndex === this.csvRecords.length - 2) {
            this.snackBar.open(`Successfully imported ${this.importedCount} expenses!`, '', {duration: 4000});
          }
        } else {
          console.log(`❌ Row ${rowIndex + 1} failed:`, res);
          this.snackBar.open(`Row ${rowIndex + 1}: ${res.message || 'Unknown error'}`, '', {duration: 4000});
        }
      }, error => {
        console.log(`❌ Row ${rowIndex + 1} error:`, error);
        
        let errorMessage = 'Unknown error';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.status === 401) {
          errorMessage = 'Token expired - please log out and log back in';
          // Show snackbar with logout option
          this.snackBar.open('Your session has expired. Please log out and log back in.', 'LOG OUT', {
            duration: 10000
          }).onAction().subscribe(() => {
            localStorage.clear();
            this.authService.onLogout();
            this.route.navigate(['']);
          });
          return; // Exit early to avoid duplicate error messages
        } else if (error.status === 403) {
          errorMessage = 'Access denied';
        }
        
        this.snackBar.open(`Error importing row ${rowIndex + 1}: ${errorMessage}`, '', {duration: 4000});
      });
  }

  importDataFromCSV(event: any) {
    if (event.target.files[0].type !== 'text/csv') {
      this.dialog.open(AlertBoxComponent, {
        data: { type: 'error' },
      });
      return;
    }
    
    let files = event.target.files;
    let file = files[0];
    var reader = new FileReader();
    
    reader.readAsText(file);
    reader.onload = (event:any)=>{
      let csv = event.target.result;
      csv = csv.toString();
      let allTextLines = csv.split(/\r\n|\n/);
      let headers = allTextLines[0].split(',');
      
      // Clean up headers
      headers = headers.map((header: string) => header.trim());
      
      for(let i=0;i<allTextLines.length-1;i++){
        allTextLines[i] = allTextLines[i].split(',');
      }
      
      this.csvRecords = allTextLines;
      
      // Set isCorrect to true so user can proceed to Review step
      this.isCorrect = true;
      
      this.snackBar.open(`CSV file loaded successfully! Found ${this.csvRecords.length - 1} rows to import.`, '', {duration: 3000});
      
      console.log('Headers:', headers);
      console.log('Data rows:', this.csvRecords.length - 1);
    }
  }
}
