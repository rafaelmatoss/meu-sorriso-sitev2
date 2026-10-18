# Associação Meu Sorriso — Website Oficial

Website institucional e plataforma de cadastro da **Associação Meu Sorriso**, organização sem fins lucrativos sediada em Salvador/BA que promove inclusão, esporte, lazer e cultura para pessoas com deficiência e suas famílias por meio do compartilhamento gratuito de equipamentos adaptados[cite: 1, 4].

🌐 **Domínio oficial:** [projetomeusorriso.com.br](https://projetomeusorriso.com.br)

---

## 📌 Visão Geral

O site apresenta as iniciativas da associação, o acervo de tecnologias assistivas disponíveis (como triciclos assistidos, handbikes, bicicletas tandem e cadeiras anfíbias)[cite: 3], uma seção de perguntas frequentes (FAQ) e um sistema integrado para cadastro de associados e responsáveis[cite: 2].

O fluxo de cadastro realiza a persistência direta em banco de dados na nuvem e gera um resumo pré-formatado para envio imediato via WhatsApp ou e-mail à equipe de coordenação[cite: 2].

---

## 🛠️ Tecnologias Utilizadas

- **Estrutura & Estilização:** HTML5 semântico e CSS3 modular.
- **Animações & Interatividade:**
  - [GSAP (GreenSock)](https://greensock.com/gsap/) & [ScrollTrigger](https://greensock.com/scrolltrigger/) para animações baseadas no scroll e transições.
  - [Lenis](https://lenis.darkroom.engineering/) para rolagem suave (*smooth scrolling*).
- **Backend as a Service:** [Supabase](https://supabase.com/) (PostgreSQL com Row Level Security ativo).
- **Hospedagem & Deploy:** [Vercel](https://vercel.com/) com CI/CD contínuo integrado ao GitHub.

---

## 📂 Estrutura de Arquivos

```text
├── index.html              # Página inicial (Apresentação, programas, conquistas e FAQ)
├── equipamentos.html       # Catálogo do acervo de equipamentos adaptados
├── cadastro.html           # Formulário de cadastro de associados e responsáveis
├── 404.html                # Página personalizada de erro 404
├── css/
│   └── styles.css          # Folhas de estilo da aplicação
├── js/
│   ├── main.js             # Lógica de interface, controle do formulário e animações
│   └── vendor/             # Dependências locais (gsap.min.js, ScrollTrigger.min.js, lenis.min.js)
├── img/                    # Imagens otimizadas do acervo e atividades
├── fonts/                  # Tipografia local (Bricolage Grotesque e Figtree)
└── README.md               # Documentação do projeto
