#!/bin/bash

# Quitter le script en cas d'erreur
set -e

echo "🚀 Début de la compilation d'Odyssey pour TrollStore..."

# 1. Compiler l'application pour appareil iOS réel en désactivant la signature
echo "🛠️ Compilation native avec xcodebuild..."
xcodebuild -workspace ios/ExploreMap.xcworkspace \
           -scheme ExploreMap \
           -configuration Release \
           -sdk iphoneos \
           -derivedDataPath build_trollstore \
           CODE_SIGNING_ALLOWED=NO \
           CODE_SIGNING_REQUIRED=NO \
           CODE_SIGN_IDENTITY="" \
           PROVISIONING_PROFILE_SPECIFIER=""

# 2. Créer la structure nécessaire pour l'IPA
echo "📁 Création du dossier Payload..."
mkdir -p build_trollstore/Payload

# 3. Copier le fichier .app généré dans le dossier Payload
echo "📦 Copie de l'application..."
cp -r build_trollstore/Build/Products/Release-iphoneos/ExploreMap.app build_trollstore/Payload/

# 4. Compresser le dossier Payload en fichier .zip puis le renommer en .ipa
echo "🗜️ Création du fichier Odyssey.ipa..."
cd build_trollstore
zip -r ../Odyssey.ipa Payload > /dev/null
cd ..

# 5. Nettoyer les fichiers de build temporaires
echo "🧹 Nettoyage des fichiers temporaires..."
rm -rf build_trollstore

echo "✅ Terminé avec succès ! Le fichier Odyssey.ipa a été généré à la racine."
