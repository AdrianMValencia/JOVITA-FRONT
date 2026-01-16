import { Component, OnInit, Inject } from '@angular/core';
import { NgForm, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from "@angular/router";


@Component({
  selector: "app-containerlogin",
  templateUrl: "./containerLogin.component.html",
  styleUrls: ["./containerLogin.component.css"],
})
export class containerLoginComponent implements OnInit {
  lLoginBoolean = true;
  hidePass = true;
  submitted = false;
  fLoginForm: FormGroup | any;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    ) {}

  ngOnInit(): void {
    this.router.navigate(["/login"]);
  }


}
