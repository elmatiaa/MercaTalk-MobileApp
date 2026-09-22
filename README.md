<div align="center">

# 🛒 MercaTalk Mobile App

**Tu compañero inteligente de compras. Una aplicación móvil diseñada para revolucionar tu experiencia en el supermercado con escaneo de productos, control de presupuesto en tiempo real e inteligencia artificial conversacional.**

[![Ionic](https://img.shields.io/badge/Ionic-3880FF?style=for-the-badge&logo=ionic&logoColor=white)](https://ionicframework.com/)
[![Angular](https://img.shields.io/badge/Angular-17-DD0031?style=for-the-badge&logo=angular)](https://angular.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

---

## 👥 Integrantes del Equipo

- **Matías Morales** (elmatiaa)
- **Eithan Santibañez

---

## 📋 Tabla de Contenidos

- [Descripción del Proyecto](#-descripción-del-proyecto)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Repositorio](#-estructura-del-repositorio)
- [Requisitos Previos](#-requisitos-previos)
- [Guía de Instalación y Ejecución](#-guía-de-instalación-y-ejecución)
  - [Paso 1: Clonar el repositorio](#paso-1-clonar-el-repositorio)
  - [Paso 2: Instalar dependencias](#paso-2-instalar-dependencias)
  - [Paso 3: Servidor de desarrollo web](#paso-3-servidor-de-desarrollo-web)
- [Compilación Móvil (Capacitor / Android)](#-compilación-móvil-capacitor--android)

---

## 📖 Descripción del Proyecto

**MercaTalk** es una aplicación móvil (PWA/Nativa) enfocada en optimizar tu visita al supermercado, evitar sobrepasar el presupuesto y proveer información interactiva.

| Módulo | Qué hace |
|---|---|
| 📷 **Escáner de Presupuesto** | Escaneo nativo (y web) de códigos de barras para ir sumando productos a tu carro virtual. |
| 📊 **Control de Gastos** | Gráfico interactivo que muestra tu límite configurado vs. lo gastado en tiempo real. |
| 📝 **Mis Listas** | Guarda y recupera presupuestos o listas de compras previamente hechas, directamente desde tu dispositivo. |
| 🤖 **Asistente Inteligente** | "Chat con Liderín" o avatares de tu supermercado favorito para consultar sobre productos, ubicación e ideas (Temporalmente oculto). |
| 🔎 **Catálogo Local** | Posibilidad de añadir productos de forma manual buscando en la base de datos o creando productos personalizados. |
| 🎨 **Personalización** | Diseño moderno fluido con temas intercambiables (ej: Líder, Jumbo, Santa Isabel). |

---

## 🧰 Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Frontend UI** | Ionic Framework (Componentes UI modernos) |
| **Lógica y Framework** | Angular (Standalone Components) + TypeScript |
| **Gráficos** | Chart.js (Visualización de presupuestos) |
| **Escáner de Códigos** | `@capacitor-community/barcode-scanner` (Nativo) y `html5-qrcode` (Fallback para Navegadores) |
| **Almacenamiento** | `localStorage` para listas y configuración local |
| **Móvil** | Capacitor (Android & iOS compatibilidad) |

---

## 📁 Estructura del Repositorio

```text
MercaTalk-MobileApp/
├── android/                        # Proyecto nativo Android generado por Capacitor
├── src/                            # Código fuente principal
│   ├── app/                        # Componentes Standalone de Angular
│   │   ├── home/                   # Dashboard principal y selector de supermercado
│   │   ├── presupuesto/            # Lógica del escáner, gráfico de torta y adición manual
│   │   ├── mis-listas/             # Historial de presupuestos guardados
│   │   ├── price-check/            # Consulta de precios rápida
│   │   ├── store-locator/          # Búsqueda de pasillos
│   │   ├── offers/                 # Ofertas destacadas
│   │   ├── recipes/                # Recomendaciones de recetas
│   │   └── services/               # Servicios (productos, chat, recetas, etc.)
│   ├── assets/                     # Imágenes, íconos (incluye avatares)
│   ├── theme/                      # Variables CSS Ionic (Colores base)
│   ├── global.scss                 # Estilos globales modernos (Ej: .modern-top-bar)
│   └── main.ts                     # Punto de entrada Angular Standalone
├── angular.json                    # Configuración de Angular CLI
├── capacitor.config.ts             # Configuración de Capacitor
├── ionic.config.json               # Configuración del CLI de Ionic
└── package.json                    # Dependencias NPM
```

---

## 🛠 Requisitos Previos

Asegúrate de tener instalados los siguientes programas:

| Herramienta | Versión recomendada | Enlace oficial |
|---|---|---|
| Node.js | 20.x LTS (incluye npm) | [Descargar Node.js](https://nodejs.org/) |
| Git | 2.40+ | [Descargar Git](https://git-scm.com/downloads) |
| Ionic CLI | Última versión (`npm install -g @ionic/cli`) | [Ionic CLI](https://ionicframework.com/) |

---

## 🚀 Guía de Instalación y Ejecución

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/elmatiaa/MercaTalk-MobileApp.git
cd MercaTalk-MobileApp
```

### Paso 2: Instalar dependencias

```bash
npm install
```

### Paso 3: Servidor de desarrollo web

Para probar la app en tu navegador (el escáner de códigos usará tu cámara web a través de HTML5):

```bash
ionic serve
```
✅ La aplicación se abrirá en `http://localhost:8100`. (Se recomienda usar la vista de dispositivo móvil en las DevTools de tu navegador).

---

## 📱 Compilación Móvil (Capacitor / Android)

MercaTalk está preparado para usar la cámara nativa del teléfono y ser una app 100% real en Android. Requiere **Android Studio** instalado.

**1. Construir la versión de producción web:**
```bash
npm run build
# O bien: ionic build --prod
```

**2. Sincronizar con el proyecto nativo Android:**
```bash
npx cap sync android
```

**3. Abrir en Android Studio:**
```bash
npx cap open android
```

Desde Android Studio, podrás compilar el APK o instalarlo directamente en tu dispositivo físico mediante depuración USB (necesario para probar la cámara nativa en alta velocidad).

---

<div align="center">

**MercaTalk Mobile App** · Tu compañero ideal para ahorrar e informarte.

</div>
