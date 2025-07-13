# 🚀 Minimalist CI/CD Pipeline

## Overview

The Mawaqit_API_to_ics CI/CD pipeline automates continuous integration to ensure code quality. This minimalist version focuses on existing tests and code quality.

## 📋 Pipeline Components

### 🔍 **Code Quality (Lint)**
- **Ruff**: Python linting and formatting
- **ESLint**: JavaScript linting with standard configuration
- **Validation**: Code style verification

### 🧪 **Automated Tests**

#### Python Tests
```bash
# Unit and integration tests
uv run pytest tests/python/ --cov=app --cov-report=term-missing
```

#### JavaScript Tests
```bash
# Unit tests
npm run test:js:unit

# Integration tests
npm run test:js:integration

# Code coverage
npm run test:js:coverage
```

## 🛠️ Configuration

### Configuration Files

#### `.github/workflows/ci-cd.yml`
Main pipeline with essential jobs.

#### `.eslintrc.json`
ESLint configuration for JavaScript.

#### `package.json`
npm scripts for linting and tests.

### Environment Variables

```yaml
env:
  PYTHON_VERSION: '3.11'
  NODE_VERSION: '18'
```

## 🔄 Development Workflow

### 1. **Local Development**
```bash
# Local tests
make test

# Local linting
make lint-all

# Formatting
make format
```

### 2. **Push to GitHub**
```bash
git push origin feature/new-feature
```

### 3. **Automatic Pipeline**
- ✅ **Code Quality**: Style validation (Python + JavaScript)
- ✅ **Python Tests**: Unit and integration tests
- ✅ **JavaScript Tests**: Frontend tests

### 4. **Pull Request**
- 🔍 **Review**: Peer validation
- ✅ **Checks**: All tests pass
- 🚀 **Merge**: Integration into `main`

## 📊 Monitoring and Reports

### Code Coverage
- **Python**: Console report
- **JavaScript**: Report in `coverage/`

### Artifacts
- **Coverage Reports**: Coverage reports
- **Test Results**: Test results

## 🚨 Error Handling

### Pipeline Failure
1. **Automatic notification** on GitHub
2. **Investigation** with available artifacts

## 🔧 Customization

### Adding Tests
```yaml
# In .github/workflows/ci-cd.yml
- name: Run custom tests
  run: |
    uv run python -m pytest tests/custom/
```

### Environment Variables
```yaml
# In GitHub secrets
DATABASE_URL: "your-database-url"
```

## 📈 Metrics and KPIs

### Code Quality
- **Coverage**: 80% minimum target
- **Linting**: 0 style errors
- **Tests**: 100% pass rate

### Performance
- **Build time**: < 5 minutes
- **Availability**: 99.9%

## 🛠️ Maintenance

### Dependency Updates
```bash
# Python (UV)
uv sync --upgrade

# JavaScript (npm)
npm update
```

### Pipeline Monitoring
- **GitHub Actions**: Integrated dashboard
- **Logs**: Available in GitHub

## 🚀 Benefits

### For the Team
- ✅ **Early bug detection**
- ✅ **Guaranteed code quality**
- ✅ **Improved collaboration**

### For the Project
- ✅ **Code stability**
- ✅ **Improved maintainability**
- ✅ **Up-to-date documentation**

## 📚 Resources

- **GitHub Actions**: [Official documentation](https://docs.github.com/en/actions)
- **UV**: [UV documentation](https://docs.astral.sh/uv/)
- **ESLint**: [ESLint documentation](https://eslint.org/)
- **Ruff**: [Ruff documentation](https://docs.astral.sh/ruff/) 

Pour pousser sur GitHub et tester la pipeline CI/CD, voici les étapes :

## 🚀 **Push sur GitHub - Étapes normales**

### 1. **Vérifier l'état actuel**
```bash
git status
```

### 2. **Ajouter les fichiers modifiés**
```bash
git add .
```

### 3. **Créer un commit**
```bash
git commit -m "feat: Add minimal CI/CD pipeline with ESLint

- Add GitHub Actions workflow (.github/workflows/ci-cd.yml)
- Add ESLint configuration for JavaScript
- Fix ESLint brace-style error in planner_page.js
- Update package.json with ESLint dependencies
- Update Makefile with lint-js commands
- Translate CI/CD documentation to English
- Remove non-existent MAWAQIT_API_KEY reference"
```

### 4. **Pousser vers GitHub**
```bash
git push origin main
```

##  **Comment vérifier que la pipeline fonctionne**

### 1. **Sur GitHub.com**
- Va sur ton repository
- Clique sur l'onglet **"Actions"**
- Tu verras la pipeline en cours d'exécution

### 2. **Les jobs qui vont s'exécuter**
- ✅ **Code Quality** : Ruff + ESLint
- ✅ **Python Tests** : pytest
- ✅ **JavaScript Tests** : Jest

### 3. **Temps d'exécution**
- **~2-3 minutes** pour la première fois
- **~1-2 minutes** pour les suivantes (cache)

## ⚠️ **Points d'attention**

### 1. **Branche de travail**
- Si tu es sur `main` : la pipeline se déclenche automatiquement
- Si tu es sur une autre branche : crée une Pull Request

### 2. **Première fois**
- GitHub va télécharger les dépendances
- Plus long la première fois
- Les fois suivantes seront plus rapides

### 3. **En cas d'échec**
- Clique sur le job qui a échoué
- Regarde les logs pour comprendre le problème
- Corrige localement et repousse

## 🛠️ **Commandes utiles**

```bash
# Vérifier l'état avant push
make lint-all
make test

# Si tout est OK, push
git add .
git commit -m "feat: Add CI/CD pipeline"
git push origin main
```

##  **Ce que tu verras sur GitHub**

1. **Onglet "Actions"** → Pipeline en cours
2. **Points verts** = succès, **rouges** = échec
3. **Logs détaillés** en cliquant sur chaque job
4. **Artefacts** (rapports de couverture) téléchargeables

Veux-tu que je t'aide à faire le push maintenant ? Ou as-tu des questions sur une étape particulière ? 