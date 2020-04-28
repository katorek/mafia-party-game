import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-winner-dialog',
  templateUrl: './winner-dialog.component.html',
  styleUrls: []
})
export class WinnerDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<WinnerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  showWinner() {
    if (this.data.winner === 'mafia') {
      return 'Mafia wygrała !';
    } else {
      return 'Mafia pokonana !';
    }

  }
}

export interface DialogData {
  winner: string;
}

