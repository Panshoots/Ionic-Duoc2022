import { Component,OnInit, ElementRef, ViewChild } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import jsQr from 'jsqr';

@Component({
  selector: 'app-camara',
  templateUrl: './camara.page.html',
  styleUrls: ['./camara.page.scss'],
})
export class CamaraPage implements OnInit {
// VARIABLES
scanerActivo = false;
scanerResultado = null;
@ViewChild('video', { static: false }) video: ElementRef;
@ViewChild('canvas', { static: false }) canvas: ElementRef;

videoElement: any;
canvasElement: any;
canvasContext: any;

loading: HTMLIonLoadingElement;

  constructor(private toast: ToastController, private loadingCtrl: LoadingController) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.videoElement = this.video.nativeElement;
    this.canvasElement = this.canvas.nativeElement;
    this.canvasContext = this.canvasElement.getContext('2d');
  }

  // METODOS PARA ABRIR, CERRAR Y RESETEAR LA CAMARA
  async openCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    this.videoElement.srcObject = stream;
    this.videoElement.setAttribute('playsinline', true);
    this.videoElement.play();

    this.loading = await this.loadingCtrl.create({});
    await this.loading.present();

    requestAnimationFrame(this.scan.bind(this));
  }

  async scan() {
    if (this.videoElement.readyState == this.videoElement.HAVE_ENOUGH_DATA) {
      if (this.loading) {
        await this.loading.dismiss();
        this.loading = null;
        this.scanerActivo = true;
      }

      this.canvasElement.height = this.videoElement.videoHeight;
      this.canvasElement.width = this.videoElement.videoWidth;

      this.canvasContext.drawImage(
        this.videoElement,
        0,
        0,
        this.canvasElement.width,
        this.canvasElement.height
      );

      const imageData = this.canvasContext.getImageData(
        0,
        0,
        this.canvasElement.width,
        this.canvasElement.height
      );

      const code = jsQr(imageData.data, imageData.width, imageData.height,{
        inversionAttempts: 'dontInvert'
      });

      if (code) {
        this.scanerActivo = false;
        this.scanerResultado = code.data;
        this.mensaje();
      } else {
        if(this.scanerActivo) {
          requestAnimationFrame(this.scan.bind(this));
        }   
      }
    } else {
      requestAnimationFrame(this.scan.bind(this));
    }

  }

  closeCamera() {
    this.scanerActivo = false;
  }

  resetCamera() {
    this.scanerResultado = null;
  }

  // METODO PARA CREAR TOAST
  async mensaje() {
    const toast = await this.toast.create({
      message: `Abrir ${this.scanerResultado}?`,
      position: 'bottom',
      buttons: [
        {
          text: 'Abrir',
          handler: () => {
            window.open(this.scanerResultado, '_system', 'location=yes');
          }
        }
      ]
    });
    toast.present();
  }
}
