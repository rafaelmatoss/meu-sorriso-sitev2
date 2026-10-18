/* Associação Meu Sorriso - comportamento do site
   GSAP + ScrollTrigger (movimento ligado ao scroll) e Lenis (rolagem suave), hospedados em js/vendor.
   Regras: nada de listener de scroll na janela, só ScrollTrigger/Lenis; tudo respeita prefers-reduced-motion;
   no mobile e sem JS o conteúdo continua legível (as seções "fixas" viram listas normais). */
(function () {
  "use strict";
  var doc = document, html = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  if (reduce) html.classList.add("reduce");
  if (!hasGsap) html.classList.add("no-anim"); else html.classList.remove("no-anim");
  html.classList.add("ready");

  var lenis = null;

  /* ------------------------------------------------------------------ rolagem suave */
  if (hasGsap && !reduce && typeof window.Lenis !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true });
    window.lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  } else if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
  }

  function scrollToY(y, immediate) {
    if (lenis) lenis.scrollTo(y, { immediate: !!immediate, duration: 1.5, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    else window.scrollTo({ top: y, behavior: reduce || immediate ? "auto" : "smooth" });
  }
  function scrollToEl(el, immediate) {
    var y = el.getBoundingClientRect().top + window.pageYOffset - 84;
    scrollToY(Math.max(0, y), immediate);
  }
  var norm = function (p) { return p.replace(/index\.html$/, "").replace(/\/$/, ""); };
  doc.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (!a || a.target === "_blank") return;
    var u;
    try { u = new URL(a.href, location.href); } catch (err) { return; }
    if (norm(u.pathname) !== norm(location.pathname) || !u.hash) return;
    var target = u.hash === "#top" ? null : $(u.hash);
    if (u.hash !== "#top" && !target) return;
    e.preventDefault();
    if (u.hash === "#top") scrollToY(0); else scrollToEl(target);
    if (history.pushState) history.pushState(null, "", u.hash === "#top" ? location.pathname : u.hash);
    setMenu(false);
  });
  $$("[data-top]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); scrollToY(0); }); });

  /* ------------------------------------------------------------------ navegação + menu */
  var nav = $("[data-nav]"), toggle = $(".nav__toggle"), menu = $("#menu");
  function setMenu(open) {
    if (!menu || !toggle) return;
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", open ? "false" : "true");
    html.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    if (lenis) { open ? lenis.stop() : lenis.start(); } else { doc.body.style.overflow = open ? "hidden" : ""; }
    if (open) { var first = $("a", menu); if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 350); }
  }
  if (toggle) toggle.addEventListener("click", function () { setMenu(toggle.getAttribute("aria-expanded") !== "true"); });
  doc.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  if (menu) $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  window.matchMedia("(min-width: 900px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
  if (lenis && nav) {
    lenis.on("scroll", function (e) {
      var y = e.scroll;
      if (y < 120) nav.classList.remove("is-hidden");
      else if (e.direction > 0 && y > 240) nav.classList.add("is-hidden");
      else if (e.direction < 0) nav.classList.remove("is-hidden");
    });
  }

  /* ------------------------------------------------------------------ acordeão (missão) */
  $$("[data-accordion]").forEach(function (acc) {
    var rows = $$("[data-row]", acc);
    rows.forEach(function (row) {
      var btn = $(".mis__btn", row);
      btn.addEventListener("click", function () {
        var willOpen = !row.classList.contains("is-open");
        rows.forEach(function (r) {
          var o = r === row ? willOpen : false;
          r.classList.toggle("is-open", o);
          $(".mis__btn", r).setAttribute("aria-expanded", o ? "true" : "false");
        });
        if (hasGsap) setTimeout(function () { ScrollTrigger.refresh(); }, 800);
      });
    });
  });

  /* ------------------------------------------------------------------ copiar dados bancários */
  function copyText(t) {
    return new Promise(function (resolve) {
      function fallback() {
        var ta = doc.createElement("textarea");
        ta.value = t; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
        doc.body.appendChild(ta); ta.select();
        try { doc.execCommand("copy"); } catch (err) { /* sem permissão */ }
        ta.remove(); resolve();
      }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(resolve, fallback);
      else fallback();
    });
  }
  $$("[data-copy]").forEach(function (b) {
    var label = $("em", b), original = label ? label.textContent : "";
    b.addEventListener("click", function () {
      copyText(b.getAttribute("data-copy")).then(function () {
        b.classList.add("is-done"); if (label) label.textContent = "Copiado";
        setTimeout(function () { b.classList.remove("is-done"); if (label) label.textContent = original; }, 2200);
      });
    });
  });

  /* ------------------------------------------------------------------ formulário de cadastro */
 var form = $("#cadForm");
if (form) initForm(form);

function initForm(form) {
  var respList = $("#respList"), msg = $("#formMsg"), count = 0;
  var area = $("[data-form-area]");
  function addResp() {
    count++;
    var idx = count, w = doc.createElement("div");
    w.className = "resp";
    w.innerHTML =
      '<div class="resp__title">Responsável ' + idx + "</div>" +
      (idx > 1 ? '<button type="button" class="resp__remove" aria-label="Remover responsável ' + idx + '"><svg class="i" aria-hidden="true"><use href="#i-x"/></svg></button>' : "") +
      '<div class="field"><label for="respNome' + idx + '">Nome completo</label><input id="respNome' + idx + '" type="text" name="respNome" autocomplete="name" required><span class="err">Informe o nome do responsável.</span></div>' +
      '<div class="grid-2">' +
      '<div class="field"><label for="respVinculo' + idx + '">Parentesco ou vínculo</label><input id="respVinculo' + idx + '" type="text" name="respVinculo" placeholder="Mãe, pai, cuidador(a)" required><span class="err">Informe o vínculo.</span></div>' +
      '<div class="field"><label for="respTel' + idx + '">Telefone ou WhatsApp</label><input id="respTel' + idx + '" type="tel" name="respTel" inputmode="tel" autocomplete="tel" required><span class="err">Informe um telefone.</span></div>' +
      "</div>" +
      '<div class="field"><label for="respEmail' + idx + '">E-mail <span class="hint">(opcional)</span></label><input id="respEmail' + idx + '" type="email" name="respEmail" autocomplete="email"></div>';
    respList.appendChild(w);
    var rm = $(".resp__remove", w);
    if (rm) rm.addEventListener("click", function () { w.remove(); });
  }
  $("#addResp").addEventListener("click", addResp);
  addResp();

  form.addEventListener("reset", function () {
    msg.innerHTML = "";
    $$(".has-error", form).forEach(function (f) { f.classList.remove("has-error"); });
    respList.innerHTML = ""; count = 0; addResp();
  });
  form.addEventListener("input", function (e) {
    var f = e.target.closest(".field, .check");
    if (f && f.classList.contains("has-error") && e.target.checkValidity()) f.classList.remove("has-error");
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    msg.innerHTML = "";
    var bad = $$("input:invalid, textarea:invalid", form);
    $$(".has-error", form).forEach(function (f) { f.classList.remove("has-error"); });
    if (bad.length) {
      bad.forEach(function (el) { var f = el.closest(".field, .check"); if (f) f.classList.add("has-error"); });
      bad[0].focus();
      msg.innerHTML = '<div class="form-error" role="alert">' + (bad.length === 1 ? "Falta 1 campo obrigatório." : "Faltam " + bad.length + " campos obrigatórios.") + " Confira os campos destacados.</div>";
      return;
    }

    var d = new FormData(form);
    var btnSubmit = form.querySelector('button[type="submit"]');
    var btnOriginalText = btnSubmit.innerHTML;

    // Desabilita o botão temporariamente enquanto grava no banco
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Gravando no sistema...";

    try {
      // 1. Gravar dados da Pessoa com Deficiência (Associado) no Supabase
      if (window.supabaseClient) {
        var lgpdCheck = $("#lgpd");

        // Gera o UUID localmente para vincular as tabelas sem precisar de SELECT
        var novoAssociadoId = (window.crypto && window.crypto.randomUUID)
          ? window.crypto.randomUUID()
          : null;

        var payloadAssociado = {
          nome: d.get("pcdNome"),
          data_nascimento: d.get("pcdNasc"),
          telefone: d.get("pcdTel") || null,
          deficiencia: d.get("pcdDef") || null,
          cidade: d.get("cidade"),
          bairro: d.get("bairro"),
          interesses: d.getAll("interesse"),
          observacoes: d.get("obs") || null,
          aceite_lgpd: lgpdCheck ? lgpdCheck.checked : true
        };

        if (novoAssociadoId) {
          payloadAssociado.id = novoAssociadoId;
        }

        // Apenas INSERT puro (sem .select())
        var { error: errAssoc } = await window.supabaseClient
          .from('associados')
          .insert(payloadAssociado);

        if (errAssoc) throw errAssoc;

        // 2. Gravar os responsáveis vinculados ao ID gerado
        var nomes = d.getAll("respNome"), vinc = d.getAll("respVinculo"), tels = d.getAll("respTel"), mails = d.getAll("respEmail");
        var listaResponsaveis = [];

        for (var i = 0; i < nomes.length; i++) {
          if (nomes[i].trim()) {
            listaResponsaveis.push({
              associado_id: novoAssociadoId,
              nome: nomes[i],
              vinculo: vinc[i],
              telefone: tels[i],
              email: mails[i] || null
            });
          }
        }

        if (listaResponsaveis.length > 0) {
          var { error: errResp } = await window.supabaseClient
            .from('responsaveis')
            .insert(listaResponsaveis);
          if (errResp) throw errResp;
        }
      }
    } catch (errBanco) {
      console.error("Erro ao salvar no Supabase:", errBanco);
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = btnOriginalText;
      msg.innerHTML = '<div class="form-error" role="alert">Erro ao registrar cadastro no banco: ' + (errBanco.message || errBanco) + '</div>';
      return; // Interrompe se o banco falhar, para não gerar falso positivo
    }

    // Restaura o botão caso o usuário decida editar depois
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = btnOriginalText;

    // 3. Mantém 100% da lógica original: Resumo visual, WhatsApp e E-mail
    var interesses = d.getAll("interesse"), nomes = d.getAll("respNome"), vinc = d.getAll("respVinculo"), tels = d.getAll("respTel"), mails = d.getAll("respEmail");
    var L = [];
    L.push("CADASTRO - ASSOCIAÇÃO MEU SORRISO", "");
    L.push("Pessoa com deficiência: " + d.get("pcdNome"));
    L.push("Nascimento: " + fmtDate(d.get("pcdNasc")));
    if (d.get("pcdTel")) L.push("Telefone: " + d.get("pcdTel"));
    if (d.get("pcdDef")) L.push("Deficiência: " + d.get("pcdDef"));
    L.push("Endereço: " + d.get("bairro") + ", " + d.get("cidade"));
    L.push("Interesse: " + (interesses.length ? interesses.join(", ") : "não informado"), "");
    for (var i = 0; i < nomes.length; i++) {
      L.push("Responsável " + (i + 1) + ": " + nomes[i] + " (" + vinc[i] + ")");
      L.push("  Telefone: " + tels[i] + (mails[i] ? "  |  E-mail: " + mails[i] : ""));
    }
    if (d.get("obs")) L.push("", "Observações: " + d.get("obs"));
    var texto = L.join("\n");

    var box = doc.createElement("div");
    box.className = "confirm"; box.setAttribute("role", "status");
    box.innerHTML =
      "<h2>Cadastro salvo com sucesso!</h2>" +
      "<p>Os dados já estão registrados no nosso sistema. Caso queira, você também pode enviar a cópia direto para o WhatsApp da equipe:</p>" +
      "<pre>" + esc(texto) + "</pre>" +
      '<div class="confirm__actions">' +
      '<a class="btn btn--primary" href="https://wa.me/5571997220221?text=' + encodeURIComponent(texto) + '" target="_blank" rel="noopener"><svg class="i" aria-hidden="true"><use href="#i-whatsapp-logo"/></svg>Enviar por WhatsApp</a>' +
      '<a class="btn btn--ghost" href="mailto:meu_sorriso@outlook.com?subject=' + encodeURIComponent("Cadastro - " + d.get("pcdNome")) + "&body=" + encodeURIComponent(texto) + '">Enviar por e-mail</a>' +
      '<button type="button" class="btn btn--ghost" data-c>Copiar dados</button>' +
      '<button type="button" class="btn btn--ghost" data-e>Editar cadastro</button>' +
      "</div>";
    form.hidden = true;
    area.appendChild(box);
    scrollToEl(box);
    $("[data-c]", box).addEventListener("click", function () {
      var b = this; copyText(texto).then(function () { b.textContent = "Copiado"; setTimeout(function () { b.textContent = "Copiar dados"; }, 2200); });
    });
    $("[data-e]", box).addEventListener("click", function () { box.remove(); form.hidden = false; scrollToEl(form); });
  });

  function fmtDate(v) { if (!v) return ""; var p = v.split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : v; }
  function esc(s) { return s.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
}
  /* ------------------------------------------------------------------ daqui pra frente: só movimento */
  if (!hasGsap || reduce) { finish(); return; }

  /* botões magnéticos: só com mouse; posição vem por variável CSS, o :active continua funcionando */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    $$("[data-magnet]").forEach(function (el) {
      var mx = gsap.quickTo(el, "--mx", { duration: 0.6, ease: "power3" });
      var my = gsap.quickTo(el, "--my", { duration: 0.6, ease: "power3" });
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.22);
        my((e.clientY - (r.top + r.height / 2)) * 0.32);
      });
      el.addEventListener("pointerleave", function () { mx(0); my(0); });
    });
  }

  /* hero (home) */
  var hero = $(".hero");
  if (hero) {
    var lines = $$(".hero h1 .ln>span");
    var tl = gsap.timeline({ defaults: { ease: "expo.out" }, delay: 0.1 });
    tl.fromTo(lines, { yPercent: 112, opacity: 1 }, { yPercent: 0, duration: 1.5, stagger: 0.13 }, 0)
      .add(function () { var h = $(".hero .hl"); if (h) h.classList.add("is-on"); }, 0.7)
      .fromTo("[data-hero-in]", { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: 0.12 }, 0.55)
      .fromTo("[data-hero-disc]", { scale: 0.15, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.8, ease: "expo.out" }, 0.1)
      .fromTo("[data-hero-card]", { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.6, stagger: 0.14 }, 0.25)
      .fromTo(".hero__sticker", { rotate: -50 }, { rotate: -10, duration: 1.8, ease: "back.out(1.6)" }, 0.6)
      .fromTo(".hero__main img", { scale: 1.3 }, { scale: 1.02, duration: 2.6, ease: "expo.out" }, 0);
    $$("[data-hero-card]").forEach(function (c) {
      var depth = parseFloat(c.getAttribute("data-depth") || "0.1");
      gsap.to(c, { y: -depth * 720, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 } });
    });
    gsap.to(".hero__disc", { yPercent: 14, scale: 1.08, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 } });
  }

  /* cabeçalhos das páginas internas */
  var ph = $("[data-phead-in]");
  if (ph) {
    gsap.fromTo(ph, { yPercent: 112, opacity: 1 }, { yPercent: 0, duration: 1.5, ease: "expo.out", delay: 0.1 });
    gsap.fromTo("[data-phead-fade]", { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: "expo.out", stagger: 0.12, delay: 0.35 });
  }
  $$("[data-parallax-img]").forEach(function (img) {
    gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: img.parentNode, start: "top bottom", end: "bottom top", scrub: 0.6 } });
  });

  /* revelações genéricas */
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 90%", once: true,
    onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.1, overwrite: true }); }
  });

  /* contadores */
  $$("[data-count]").forEach(function (el) {
    var to = parseFloat(el.getAttribute("data-count")), from = parseFloat(el.getAttribute("data-from") || "0");
    var pre = el.getAttribute("data-prefix") || "", suf = el.getAttribute("data-suffix") || "", o = { v: from };
    el.textContent = pre + from + suf;
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: function () {
        gsap.to(o, { v: to, duration: 2.4, ease: "power3.out", onUpdate: function () { el.textContent = pre + Math.round(o.v) + suf; } });
        var st = el.closest("[data-stat]"); if (st) st.classList.add("is-on");
      }
    });
  });

  /* manifesto: cada palavra acende conforme a leitura avança */
  var mp = $("[data-manifesto]");
  if (mp) {
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) frag.appendChild(doc.createTextNode(tok));
            else { var s = doc.createElement("span"); s.className = "w"; s.textContent = tok; frag.appendChild(s); }
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.classList.contains("chip")) split(n);
      });
    })(mp);
    var words = $$(".w", mp);
    gsap.set(words, { opacity: 0.16 });
    gsap.to(words, { opacity: 1, ease: "none", stagger: 0.12, scrollTrigger: { trigger: mp, start: "top 78%", end: "bottom 58%", scrub: 0.5 } });
    $$(".chip", mp).forEach(function (c) {
      gsap.fromTo(c, { scale: 0.3, opacity: 0.2 }, { scale: 1, opacity: 1, ease: "none", scrollTrigger: { trigger: c, start: "top 82%", end: "top 58%", scrub: 0.4 } });
    });
  }

  /* imagens que "abrem" ao entrar na tela */
  $$("[data-zoom]").forEach(function (el) {
    var img = $("img", el);
    gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom 35%", scrub: 0.6 } });
  });

  /* cartões empilhados: o anterior recua quando o próximo chega */
  var cards = $$("[data-scard]");
  cards.forEach(function (card, i) {
    var next = cards[i + 1]; if (!next) return;
    gsap.to(card, { scale: 0.94, "--dim": 0.62, ease: "none", scrollTrigger: { trigger: next, start: "top 88%", end: "top " + (88 + (i + 1) * 26) + "px", scrub: true } });
  });

  /* leque de fotos do acervo */
  var fan = $("[data-fan]");
  if (fan) {
    gsap.from($$("figure", fan), { rotate: 0, xPercent: function (i) { return [55, 0, -55][i]; }, yPercent: 10, duration: 1.8, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: fan, start: "top 75%", once: true } });
  }

  /* passos de reserva: a linha desenha conforme você avança */
  var steps = $("[data-steps]");
  if (steps) {
    gsap.fromTo($("[data-steps-line]", steps), { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: steps, start: "top 55%", end: "bottom 60%", scrub: 0.4 } });
    $$("[data-step]", steps).forEach(function (s) {
      ScrollTrigger.create({ trigger: s, start: "top 62%", onEnter: function () { s.classList.add("is-on"); }, onLeaveBack: function () { s.classList.remove("is-on"); } });
    });
  }

  /* bento do acervo */
  var bento = $("[data-bento]");
  if (bento) {
    gsap.set($$("[data-cell]", bento), { opacity: 0 });
    ScrollTrigger.batch($$("[data-cell]", bento), {
      start: "top 90%", once: true,
      onEnter: function (b) { gsap.fromTo(b, { opacity: 0, y: 60, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 1.3, ease: "expo.out", stagger: 0.09 }); }
    });
  }

  /* marca do rodapé */
  var fm = $(".foot__mark");
  if (fm) gsap.from(fm, { yPercent: 24, opacity: 0, duration: 1.8, ease: "expo.out", scrollTrigger: { trigger: fm, start: "top 96%", once: true } });

  /* ---------------------------------------------------- seções fixas (só desktop) */
  var mm = gsap.matchMedia();

  /* conquistas: rolagem vertical vira pan horizontal */
  mm.add("(min-width: 900px) and (min-height: 560px)", function () {
    var sec = $("[data-wins]"), track = $("[data-wins-track]"), bar = $("[data-wins-bar]");
    if (!sec || !track) return;
    sec.classList.add("is-pinned");
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    gsap.to(track, {
      x: function () { return -dist(); }, ease: "none",
      scrollTrigger: {
        trigger: sec, start: "top top", end: function () { return "+=" + dist(); },
        pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: function (s) { bar.style.transform = "scaleX(" + s.progress + ")"; }
      }
    });
    return function () { sec.classList.remove("is-pinned"); gsap.set(track, { clearProps: "transform" }); bar.style.transform = ""; };
  });

  /* programas: capítulos que trocam enquanto a seção fica fixa */
  mm.add("(min-width: 1024px) and (min-height: 640px)", function () {
    var sec = $("[data-prog]"), stage = $("[data-prog-stage]"), list = $("[data-prog-list]");
    if (!sec || !stage) return;
    var items = $$(".pcard", stage), n = items.length, cur = -1, btns = [];
    sec.classList.add("is-pinned");
    list.innerHTML = "";
    items.forEach(function (c, i) {
      var b = doc.createElement("button"); b.type = "button"; b.textContent = c.getAttribute("data-title");
      b.addEventListener("click", function () {
        var y = st.start + ((i + 0.5) / n) * (st.end - st.start);
        scrollToY(y);
      });
      list.appendChild(b); btns.push(b);
    });
    function setActive(i) {
      if (i === cur) return; cur = i;
      items.forEach(function (c, k) { c.classList.toggle("is-active", k === i); });
      btns.forEach(function (b, k) { b.setAttribute("aria-current", k === i ? "true" : "false"); });
    }
    setActive(0);
    var st = ScrollTrigger.create({
      trigger: sec, start: "top top", end: function () { return "+=" + Math.round(window.innerHeight * 0.55 * n); },
      pin: true, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: function (s) { setActive(Math.min(n - 1, Math.floor(s.progress * n))); }
    });
    return function () {
      sec.classList.remove("is-pinned"); list.innerHTML = "";
      items.forEach(function (c) { c.classList.remove("is-active"); });
    };
  });

  finish();

  function finish() {
    var go = function () {
      if (hasGsap) ScrollTrigger.refresh();
      try { var hEl = location.hash && $(location.hash); if (hEl) scrollToEl(hEl, true); } catch (err) { /* hash invalido */ }
    };
    if (doc.readyState === "complete") setTimeout(go, 60); else window.addEventListener("load", function () { setTimeout(go, 60); });
    if (doc.fonts && doc.fonts.ready && hasGsap) doc.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
