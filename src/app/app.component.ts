import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  title = 'app';
  lControl: boolean = false;

  constructor(
    private cdr: ChangeDetectorRef
    ){}

  ngOnInit() {
    this.cdr.detectChanges();
  }
}
