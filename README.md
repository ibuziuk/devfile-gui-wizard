[![Contribute](https://www.eclipse.org/che/contribute.svg)](https://workspaces.openshift.com#https://github.com/ibuziuk/devfile-gui-wizard)
[![Dev](https://img.shields.io/static/v1?label=Open%20in&message=Che%20dogfooding%20server%20(with%20VS%20Code)&logo=eclipseche&color=FDB940&labelColor=525C86)](https://che-dogfooding.apps.che-dev.x6e0.p1.openshiftapps.com#https://github.com/ibuziuk/devfile-gui-wizard)

# Devfile GUI Wizard

A user-friendly, modern web application for creating [devfile 2.3.0](https://devfile.io/) configuration files through an interactive step-by-step wizard interface.

![Devfile Version](https://img.shields.io/badge/devfile-2.3.0-blue)
![React](https://img.shields.io/badge/react-18.3.1-61dafb)
![Tailwind CSS](https://img.shields.io/badge/tailwind-3.4.0-38bdf8)
![Vite](https://img.shields.io/badge/vite-5.4.0-646cff)

## Overview

The Devfile GUI Wizard simplifies the process of creating devfile YAML configurations by providing an intuitive, guided experience. No need to memorize the devfile schema or YAML syntax—just fill out the forms and download your ready-to-use `devfile.yaml`.

## Features

- ✨ **8-Step Wizard Interface** - Guided workflow covering every section of the devfile schema
- 📐 **Complete 2.3.0 Schema Coverage** - Every field of the devfile 2.3.0 schema is editable, including `parent` with overrides, `dependentProjects`, image components and free-form attributes
- 🎯 **Real-time YAML Preview** - See your devfile generated as you type
- ✅ **Schema and Semantic Validation** - JSON schema constraints plus the semantic rules enforced by [devfile/api](https://github.com/devfile/api/blob/main/pkg/validation/validation-rule.md)
- 📥 **One-Click Download** - Export your devfile.yaml instantly
- 📋 **Copy to Clipboard** - Quick copy functionality
- 🎨 **Responsive Design** - Works on desktop, tablet, and mobile
- ↩️ **Free Navigation** - Jump to any step at any time; every devfile section is optional
- 🔄 **Reset Wizard** - Start fresh at any time
- 🎭 **No Backend Required** - Fully client-side application

## Wizard Steps

1. **Metadata** - schemaVersion and devfile metadata (name, version, tags, architectures, icon, attributes, ...)
2. **Parent** - Inherit from another devfile by URI, registry id or Kubernetes DevWorkspaceTemplate, with full overrides
3. **Projects** - Projects, starter projects and dependent projects (Git or Zip sources)
4. **Components** - container, kubernetes, openshift, volume and image components
5. **Commands** - exec, apply and composite commands with groups and defaults
6. **Events** - preStart, postStart, preStop and postStop bindings, ordered and type-checked
7. **Variables & Attributes** - Substitution variables and free-form devfile attributes
8. **Review & Download** - Validation report, summary and download

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18.x or higher
- npm 9.x or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/devfile-gui-wizard.git
   cd devfile-gui-wizard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Development Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server (with hot reload) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm test` | Run the generator and validation test suites |
| `npm run test:watch` | Run the tests in watch mode |

The test suite validates generated devfiles against the official devfile 2.3.0 JSON schema
(vendored in `schemas/devfile-2.3.0.json`) with [ajv](https://ajv.js.org/), and covers every
semantic rule the wizard enforces.

## OpenShift Deployment

The application can be deployed to OpenShift using Kustomize. The deployment manifests are located in the `openshift/` directory.

### Prerequisites

- OpenShift CLI (`oc`) or Kubernetes CLI (`kubectl`) installed
- Access to an OpenShift cluster
- Container image built and pushed to a registry (automatically built via GitHub Actions)

### Quick Deploy

1. **Set your namespace** (optional):
   ```bash
   oc project your-project-name
   # or create a new project
   oc new-project devfile-gui-wizard
   ```

2. **Deploy using Kustomize**:
   ```bash
   kubectl apply -k openshift
   ```
   
   Or with `oc`:
   ```bash
   oc apply -k openshift
   ```

3. **Get the application URL**:
   ```bash
   oc get route devfile-gui-wizard -o jsonpath='{.spec.host}'
   ```

### Verify Deployment

```bash
# Check deployment status
kubectl get deployment devfile-gui-wizard

# Check pods
kubectl get pods -l app=devfile-gui-wizard

# Check service
kubectl get service devfile-gui-wizard

# Check route (OpenShift)
oc get route devfile-gui-wizard
```

### Customization

The deployment uses the image `ghcr.io/ibuziuk/devfile-gui-wizard:latest` by default. To customize:

1. **Update image tag**: Edit `openshift/kustomization.yaml`:
   ```yaml
   images:
     - name: ghcr.io/ibuziuk/devfile-gui-wizard
       newName: ghcr.io/ibuziuk/devfile-gui-wizard
       newTag: v1.0.0  # or specific commit hash
   ```

2. **Adjust replica count**: Edit `openshift/kustomization.yaml`:
   ```yaml
   replicas:
     - name: devfile-gui-wizard
       count: 3
   ```

3. **Set namespace**: Edit `openshift/kustomization.yaml`:
   ```yaml
   namespace: my-project
   ```

### Preview Changes

Before applying, preview what will be deployed:

```bash
kubectl kustomize openshift
```

### Cleanup

To remove all resources:

```bash
kubectl delete -k openshift
```

## Technology Stack

- **Frontend Framework:** React 18.3.1
- **Styling:** Tailwind CSS 3.4.0 with @tailwindcss/forms plugin
- **Build Tool:** Vite 5.4.0
- **YAML Generation:** js-yaml 4.1.0
- **State Management:** React useReducer + Context API
- **Language:** JavaScript (ES6+)

## Project Structure

```
devfile-gui-wizard/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable UI components (Button, Card, Alert, Badge)
│   │   ├── forms/           # Form primitives (Input, Select, Boolean, lists, attributes)
│   │   ├── editors/         # Schema editors reused by steps and parent overrides
│   │   ├── wizard/          # Wizard navigation and container
│   │   ├── steps/           # Individual wizard step components
│   │   └── preview/         # YAML preview component
│   ├── hooks/               # Custom React hooks
│   │   ├── useWizardState.jsx    # State management
│   │   └── useYamlGenerator.jsx  # YAML generation
│   ├── utils/               # Utility functions
│   │   ├── devfileGenerator.js   # Wizard state -> devfile object/YAML
│   │   ├── validation.js         # Schema and semantic validation
│   │   ├── downloadFile.js       # File download utility
│   │   └── constants.js          # Schema enums, patterns and entry factories
│   ├── App.jsx              # Root component
│   ├── main.jsx             # Application entry point
│   └── index.css            # Global styles
├── schemas/                 # Vendored devfile 2.3.0 JSON schema (used by tests)
├── tests/                   # Vitest suites for the generator and validation
├── public/                  # Static assets
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
├── CLAUDE.md                # Claude Code instructions
└── README.md                # This file
```

## How It Works

1. **State Management**: The application uses React's `useReducer` hook combined with Context API to manage the wizard state and devfile data.

2. **Validation**: Each step includes field-level validation to ensure data integrity and devfile 2.3.0 compliance.

3. **YAML Generation**: The `js-yaml` library converts the structured JavaScript object into properly formatted YAML, with custom cleaning to remove empty fields.

4. **Download**: The browser's Blob API creates a downloadable file from the generated YAML content.

## Devfile 2.3.0 Support

Every field of the devfile 2.3.0 schema is editable. See [SCHEMA_COVERAGE.md](SCHEMA_COVERAGE.md)
for the field-by-field matrix.

- **schemaVersion**: 2.0.0 through 2.3.0
- **metadata**: name, version, displayName, description, tags, icon, globalMemoryLimit, projectType,
  language, website, provider, supportUrl, architectures, attributes
- **parent**: by `uri`, registry `id` (+ `registryUrl`) or `kubernetes` DevWorkspaceTemplate, with a
  `version` and overrides for attributes, components, commands, projects, starterProjects,
  dependentProjects and variables
- **projects / starterProjects / dependentProjects**: Git (multiple remotes, `checkoutFrom`) and Zip
  sources, `clonePath`, `description`, `subDir`, attributes
- **components**:
  - `container`: image, command, args, env, memory/cpu request and limit, mountSources,
    sourceMapping, dedicatedPod, volumeMounts, endpoints, deployment and service annotations
  - `kubernetes` / `openshift`: `uri` or `inlined` manifest, deployByDefault, endpoints
  - `volume`: size, ephemeral
  - `image`: imageName, autoBuild and a Dockerfile from a URI, a devfile registry or a Git repository
    (buildContext, rootRequired, build args)
  - `endpoints`: name, targetPort, protocol, exposure, path, secure, annotations, attributes
- **commands**: `exec` (commandLine, component, workingDir, env, label, hotReloadCapable),
  `apply` (component, label) and `composite` (ordered sub-commands, parallel), each with a
  `group` of kind build/run/test/debug/deploy and an `isDefault` flag
- **events**: preStart, postStart, preStop, postStop — ordered, with the apply/exec rules enforced
- **variables**: string substitution with `{{variable}}` syntax
- **attributes**: free-form YAML on the devfile, metadata, components, commands, projects and endpoints

### Validation

Beyond the JSON schema, the wizard enforces the semantic rules from
[devfile/api validation](https://github.com/devfile/api/blob/main/pkg/validation/validation-rule.md):
unique names and ids, endpoint name and port uniqueness, reserved `PROJECT_SOURCE`/`PROJECTS_ROOT`
env names, volume mount references, resource request/limit ordering, annotation conflicts, command
component kinds, composite command cycles, one default command per group kind, event command kinds,
and the git remote/checkout rules for projects and starter projects.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Resources

- [Devfile Official Documentation](https://devfile.io/docs/)
- [Devfile 2.3.0 Schema](https://devfile.io/docs/2.3.0/devfile-schema)
- [GitHub Issue #1765 - Original Feature Request](https://github.com/devfile/api/issues/1765)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Vite Documentation](https://vitejs.dev/)

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Built with [Claude Code](https://claude.ai/code)
- Devfile specification by the [Devfile Community](https://devfile.io/)
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)

---

**Made with ❤️ for the Devfile community**
