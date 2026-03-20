# Prospects VI — Guide de déploiement

## Étape 1 : Configurer Supabase

1. Ouvrir le **SQL Editor** dans le dashboard Supabase
2. Coller et exécuter le contenu du fichier `01_supabase_setup.sql`
3. Vérifier dans **Table Editor** que la table `prospects` existe avec 6 lignes

## Étape 2 : Activer le Realtime (pour les mises à jour entre collègues)

1. Dans Supabase, aller dans **Database → Replication**
2. Cliquer sur la table `prospects`
3. Activer les événements : INSERT, UPDATE, DELETE

## Étape 3 : Pousser le code sur GitHub

1. Créer un nouveau repository sur github.com (ex: `prospects-vi`)
2. Dans un terminal :

```bash
cd prospects-vi
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/prospects-vi.git
git push -u origin main
```

## Étape 4 : Déployer sur Vercel

1. Aller sur vercel.com et se connecter avec GitHub
2. Cliquer **"Add New Project"**
3. Sélectionner le repo `prospects-vi`
4. Framework Preset : **Vite**
5. Cliquer **Deploy**
6. Attendre ~1 minute → votre URL est prête !

## Partager avec l'équipe

Partager l'URL Vercel (ex: `prospects-vi.vercel.app`) avec vos collègues.
Tout le monde voit et modifie les mêmes données en temps réel.
