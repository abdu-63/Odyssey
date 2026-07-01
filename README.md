# Odyssey

Odyssey est une application mobile d'exploration du monde reel inspiree du concept de brouillard de guerre (Fog of War). Au fur et a mesure de vos deplacements reels, la carte se devoile en temps reel grace a votre position GPS.

## Fonctionnalites

- Brouillard de guerre en temps reel devoilant la carte sous forme de grille hexagonale au fil de vos deplacements.
- Utilisation de l'index spatial H3 (resolution 10) d'Uber pour le decoupage geospatial de la carte.
- Cartographie interactive fluide basee sur le SDK natif de Mapbox.
- Suivi de la position GPS en arriere-plan grace a Expo Location et Expo Task Manager.
- Stockage local persistant des zones explorees avec Expo SQLite.
- Systeme de statistiques d'exploration detaillees.
- Systeme d'accomplissements (succes) deverrouillables selon vos exploits d'exploration.

## Installation Directe (IPA)

Si vous souhaitez simplement installer l'application sur votre iPhone sans avoir a la compiler vous-meme :

1. Rendez-vous dans la section [Releases](releases) de ce depot GitHub.
2. Telechargez le fichier `Odyssey.ipa` de la derniere version disponible.
3. Installez le fichier sur votre appareil à l'aide de **TrollStore** (methode recommandee), **AltStore** ou **Sideloadly**.

## Technologies utilisees

- React Native avec Expo SDK 52 (Expo Router, Expo Dev Client).
- Mapbox Maps SDK via @rnmapbox/maps.
- Uber H3 via h3-js.
- Gestion d'etat globale avec Zustand.
- Base de donnees locale avec Expo SQLite.
- TypeScript pour le typage statique.

## Prerequis

- Node.js (version LTS recommandee).
- npm ou yarn pour la gestion des paquets.
- Xcode (sur macOS) pour la compilation iOS.
- CocoaPods installe sur votre systeme macOS.
- Un compte Mapbox avec un token d'acces public et un token secret de telechargement.

## Configuration

### 1. Variables d'environnement

Copiez le fichier .env.example vers un nouveau fichier nomme .env a la racine du projet :

```bash
cp .env.example .env
```

Remplissez les variables d'environnement suivantes dans le fichier .env :

- EXPO_PUBLIC_MAPBOX_TOKEN : Votre token public Mapbox (pk.xxx), utilise a l'execution pour afficher les cartes.
- MAPBOX_SECRET_TOKEN : Votre token secret Mapbox (sk.xxx), requis lors du build natif pour telecharger le SDK natif Mapbox. Ce token doit disposer du scope DOWNLOADS:READ.

### 2. Configuration du SDK Mapbox pour iOS

Le SDK Mapbox necessite une configuration specifique pour CocoaPods afin de pouvoir recuperer les dependances natives. Le token secret defini dans votre fichier .env sera automatiquement utilise par les scripts de configuration d'Expo lors de la phase de prebuild pour configurer le fichier ~/.netrc sur votre machine.

## Installation

1. Installez les dependances du projet :
   ```bash
   npm install
   ```

2. Generez les fichiers natifs iOS et Android (Prebuild) :
   ```bash
   npm run prebuild
   ```
   Cette commande execute expo prebuild et configure les dossiers ios/ et android/ requis pour l'execution native et le chargement des dépendances comme le SDK Mapbox.

## Compilation et Execution en Developpement (Dev Build)

Etant donne que cette application utilise des modules natifs personnalises (Mapbox, SQLite, Task Manager en arriere-plan), elle ne peut pas fonctionner dans l'application standard Expo Go. Vous devez generer un client de developpement (Dev Client) natif.

### Etape 1 : Executer le serveur Metro

Lancez le serveur de developpement Metro a la racine du projet :

```bash
npm run start
```

### Etape 2 : Compiler et lancer l'application sur un simulateur ou un appareil reel

#### Pour iOS (Simulateur ou Appareil physique connecte) :
Compilez et lancez l'application en mode developpement sur iOS :
```bash
npm run ios
```
ou via Expo CLI :
```bash
npx expo run:ios
```

#### Pour Android (Emulateur ou Appareil physique connecte) :
Compilez et lancez l'application en mode developpement sur Android :
```bash
npm run android
```
ou via Expo CLI :
```bash
npx expo run:android
```

Une fois l'application compilee pour la premiere fois sur votre appareil/simulateur, le client de developpement se connectera a votre serveur Metro local. Vous pouvez alors effectuer des modifications dans le code et beneficier du Fast Refresh.

## Creation du fichier .ipa (iOS)

Un script est integre au projet pour compiler l'application en mode Release et generer un fichier .ipa sans signature de code, pret a etre installe via TrollStore ou a etre signe avec un outil de sideload tiers (comme AltStore ou Sideloadly).

### Fonctionnement du script build-ipa.sh

Le script effectue les etapes suivantes :
1. Compilation native en mode Release a l'aide de xcodebuild en ciblant un appareil iOS reel (sdk iphoneos) et en desactivant explicitement la signature de code (CODE_SIGNING_ALLOWED=NO).
2. Creation d'une structure de dossiers temporaire nommee build_trollstore/Payload.
3. Copie du fichier compile Odyssey.app dans le dossier Payload.
4. Compression du dossier Payload au format ZIP, puis renommage en Odyssey.ipa a la racine du projet.
5. Nettoyage des fichiers temporaires de build.

### Executer la compilation de l'IPA

Pour generer le fichier .ipa, executez la commande suivante sur une machine macOS equipee de Xcode :

```bash
npm run build:ipa
```

Une fois la compilation terminee, le fichier Odyssey.ipa sera cree a la racine du projet. Vous pouvez alors le transferer sur votre iPhone et l'installer via TrollStore.
