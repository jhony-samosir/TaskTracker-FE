import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { TaskPriority } from '../../../../core/models/task.model';
import { TaskFormDialogData, TaskFormDialogResult } from '../../models/task-management.model';

function assigneeNotReviewerValidator(control: AbstractControl): ValidationErrors | null {
  const assigneeId = control.get('assigneeId')?.value;
  const reviewerId = control.get('reviewerId')?.value;
  if (assigneeId && reviewerId && assigneeId === reviewerId) {
    return { sameUser: true };
  }
  return null;
}

@Component({
  selector: 'app-task-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './task-form-dialog.html',
  styleUrl: './task-form-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormDialog implements OnInit {
  protected readonly data = inject<TaskFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TaskFormDialog, TaskFormDialogResult>);

  protected readonly saving = signal(false);

  protected readonly priorities: { value: TaskPriority; label: string }[] = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
  ];

  protected readonly form = new FormGroup(
    {
      title: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(200)],
      }),
      description: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(1000)],
      }),
      assigneeId: new FormControl<number | ''>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      reviewerId: new FormControl<number | ''>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      deadline: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      priority: new FormControl<TaskPriority>('MEDIUM', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      comment: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
      document: new FormControl('', { nonNullable: true }),
    },
    { validators: assigneeNotReviewerValidator },
  );

  ngOnInit(): void {
    if (this.data.mode === 'edit' && this.data.task) {
      const task = this.data.task;
      this.form.patchValue({
        title: task.title,
        description: task.description ?? '',
        assigneeId: task.assigneeId,
        reviewerId: task.reviewerId,
        deadline: task.deadline,
        priority: task.priority ?? 'MEDIUM',
        comment: task.comment ?? '',
        document: task.document ?? '',
      });
    }
  }

  protected get isEdit(): boolean {
    return this.data.mode === 'edit';
  }

  protected get formTitle(): string {
    return this.isEdit ? 'Edit Task' : 'Create New Task';
  }

  protected get minDeadline(): Date {
    return new Date();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const deadline = raw.deadline as unknown;
    const result: TaskFormDialogResult = {
      mode: this.data.mode,
      value: {
        title: raw.title,
        description: raw.description,
        assigneeId: raw.assigneeId as number,
        reviewerId: raw.reviewerId as number,
        deadline:
          deadline instanceof Date ? deadline.toISOString().split('T')[0] : String(deadline),
        priority: raw.priority,
        comment: raw.comment,
        document: raw.document,
      },
      taskId: this.isEdit ? this.data.task?.id : undefined,
    };
    this.dialogRef.close(result);
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
