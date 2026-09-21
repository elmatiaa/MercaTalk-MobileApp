import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MisListasComponent } from './mis-listas.component';

describe('MisListasComponent', () => {
  let component: MisListasComponent;
  let fixture: ComponentFixture<MisListasComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MisListasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MisListasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
