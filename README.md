# Círculo Web/PWA

Web-app instalable opcionalmente desde el navegador y accesible mediante enlace de WhatsApp.

## Para ponerla online

1. Crea un proyecto Firebase.
2. Activa Authentication > Anonymous.
3. Crea Firestore y publica `firestore.rules`.
4. Registra una app web y copia su configuración en `firebase-config.js`.
5. En Settings > Pages selecciona GitHub Actions.
6. El workflow generará una URL `https://USUARIO.github.io/REPOSITORIO/`.

La app genera enlaces de la forma `?circle=CODIGO`, listos para enviar por WhatsApp.

## Límite importante

Una web no puede garantizar ubicación permanente cuando el navegador está cerrado o el sistema suspende la pestaña. Funciona mientras la PWA/web permanece abierta o activa. Para seguimiento realmente continuo en segundo plano hace falta la app Android/iOS nativa.
