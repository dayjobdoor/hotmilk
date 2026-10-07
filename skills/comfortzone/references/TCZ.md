# 苫米地認知宇宙論 全定理 統合サマリー（定理1–32）
*認知物理学・認知生物学／コーチング形式定義／認知戦〜仏法数理まで*

> **位置づけ**: `comfortzone` スキルの理論参照（この 1 部だけ）。スキル本体は AI エージェントへの写像と操作手順を持ち、理論はこのファイルへ委ねる。

https://tomabechi.jp/

https://tomabechi.jp/CoachingFormalDefinitionDrT20251005.pdf

https://tomabechi.jp/archives/51662332.html
https://tomabechi.jp/TomabechiEvolution5theoremsJA.html
https://tomabechi.jp/TomabechiEvolution5theoremsEN.html

https://tomabechi.jp/TomabechiNDUpaperJApublic.pdf
https://tomabechi.jp/TomabechiNDUpaperENpublic.pdf

https://tomabechi.jp/TomabechiSlidesSCJA20260422.pdf
https://tomabechi.jp/TomabechiSlidesSCEN20260422.pdf
https://www.stimson.org/event/cognitive-warfare-ai-and-security-insights-from-east-asia/

http://tomabechi.jp/%E6%83%85%E5%A0%B1%E5%AD%A6%E3%82%B7%E3%83%B3%E3%83%9D%E3%82%B8%E3%82%A6%E3%83%A0%E8%8B%AB%E7%B1%B3%E5%9C%B0%E8%8B%B1%E4%BA%BA20230520.pdf

http://tomabechi.jp/EmptinessDrTomabechi20110930.pdf
http://tomabechi.jp/archives/50316486.html
http://www.tomabechi.jp/EmptinessJapanese.pdf

https://tomabechi.jp/TomabechiTimeTheoryMin6JA.html
https://tomabechi.jp/TomabechiTimeTheoryMin6EN.html

https://tomabechi.jp/TomabechiGlobalSummit2026.pdf

https://tomabechi.jp/TomabechiFourDharmaSealsMini13LayJA.html
https://tomabechi.jp/TomabechiFourDharmaSealsMini13JA.html

https://tomabechi.jp/TomabechiAvijjaSankharaLayJA.html
https://tomabechi.jp/TomabechiAvijjaSankharaJA.html
https://tomabechi.jp/TomabechiAvijjaSankharaEN.html
https://tomabechi.jp/TomabechiTheorems28to32JA.html
https://tomabechi.jp/TomabechiTheorems28to32EN.html

---

## 0. 三つの設計質問への回答

### Q1｜達成度は数値で表せるか → **表せる**。全定理が Lyapunov 残差 Φ と距離 dist に還元される

| 量 | 定義 | 意味・挙動 |
|---|---|---|
| 評価ポテンシャル | $V_0(x,t)\ge 0$ | 不安定性・不快的コスト。低いほど良い |
| 零残差（達成度の核） | $\Phi(x,t)=[V_0(x,t)-\theta]^+$ | $0$ で TCZ 到達。$\Phi(t)\le\Phi(0)e^{-ct}$ |
| 距離 | $\mathrm{dist}(x(t),TCZ)\to 0$ | 安定域・ゴール到達 |
| ゴール駆動強度（T9） | $K_G=PQ^++EC_{\text{Self}}\ge K_{\text{crit}}$ | 閾値超えで到達が自動化 |
| 臨場感・価値符号（T4） | $P\in[0,1],\ Q\in[-1,1]$ | 実効ポテンシャル $\tilde V=V_0-\kappa PQ$ |
| 自由意思容量（T19） | $\mathcal{F}_i(\alpha)=\sup_{d,\pi} I(G;Y\mid X)$ | 抽象度に対し単調非減少、$\mathcal F(\top)=1$ |
| 残余最適コスト（T24） | $J^*_{a,\rho}(x,T)$ | 空未満では常に $>0$ |

→ 実装では「1–10 スコア（臨場感 P・価値 Q・エフィカシー）」＋「残差 Φ・距離 dist の計算」で足りる。

**スケール正典（スキルの実装はこの表に統一する）**:

| 量 | 実装スケール | 理論値への換算 |
|---|---|---|
| 臨場感 $P$ | 1–10 自己評価 | スコア ÷ 10 |
| 価値符号 $Q$ | −1…+1 | そのまま（$Q^{+}=\max(Q,0)$） |
| エフィカシー | 1–10 自己評価 | $EC_{\text{Self}}=$ スコア ÷ 10 |
| 自己整合性 $C_{\text{Self}}$ | −1…+1 | そのまま（T7 採用条件は $C_{\text{Self}}>0$） |
| 距離 dist | 0–10 | 外部性の初期目安 $\varepsilon=1$ |

到達条件 $K_G=PQ^{+}+EC_{\text{Self}}\ge K_{\text{crit}}$ の $K_{\text{crit}}$ 初期値は $1.0$（運用で校正する定数）。

### Q2｜ゴール設計・管理はファイルベースか → **理論は形式を問わない。だが終端条件の明示が必須**

定理7 はゴール $G$ を「終端条件」として定義し、4条件を要求する（下記 T7）。形式は理論の対象外で、終端条件の明示だけが必須（`comfortzone` スキルはチェック一覧で明示し、複数セッションにまたがるときだけ `GOAL.md` に残す）：

```
GOAL.md  ├ 記述（望む未来世界）
         ├ dist(·,G) の定義     ← 達成度の distance
         ├ λ（終端重み）        ← ゴールが制御をどれだけ引くか
         ├ P（臨場感）, CSelf（自己整合性）
         └ 外部性チェック dist(G,TCZ0) > ε  ← 「タスク」との区別
```
ポイント：**タスクは TCZ の内側**（$G\in TCZ_0$）、**真のゴールは外側**（$G\notin TCZ_0$）。ファイルにはこの区別を明記する。

### Q3｜ループするべきか → **ループは数学的必然。ただし終了条件つき**

- Ego は**反復ホライズン方策** $\pi_c(t,x):=u^*_{t,x}(t^+)$（各時刻で有限地平 $[t,t+T]$ を再最適化）＝構造的にループ。
- **補題0（統一 Lyapunov 収束補題）**：$D^+\Phi\le -2c\Phi$ なら $\Phi(t)\le\Phi(0)e^{-2ct}$（Grönwall）で指数減衰。
- **T32（絶対他力）**：Self が未来TCZ外の $G$ を終端条件にすると、旧Egoの追加努力**なしに**未来TCZへ自律収束。

→ ループは必須だが無限ループではない。**$\mathrm{dist}(x(t),TCZ)\to 0$ を終了条件**にする。

---

## 1. 理論の全体像

- **認知物理学（Cognitive Physics）**：認知状態が法則的動力学で時間発展。
- **認知生物学（Cognitive Biology）**：抽象度・臨場感・利他性が選択の対象。
- 統一言語：**TCZ・Ego 制御オペレーター・LUB・未来原点認知時間**。
- 中心命題：**自己変革とは、望む未来の臨場感を現在の現実より高め、その未来を新たな TCZ として再構成すること**（[苫米地進化論（5定理版）](https://tomabechi.jp/TomabechiEvolution5theoremsJA.html)）
- 認知戦からの反転：認知戦＝「対象集団の $V(x,t)$ を外部から変形し TCZ を再構成」。同じ数理を**自律性を高次化する方向**へ反転＝コーチング・自己変革。

---

## 2. 記号と基盤定義

- 認知状態 $x(t)\in X\subset\mathbb{R}^n$（信念・感情・自己像・未来予測…の全体）
- 評価関数 $V_0(x,t)\ge 0$（不整合コスト）
- 制御系 $\dot x=f(x,u,t)$、方策 $\pi_c$
- **TCZ**：$\displaystyle TCZ(x_0)=\bigcup_{t\ge0}\{\,x(t)\in\mathcal{R}(t;x_0)\mid V(x(t),t)\le\theta\,\}$
- **抽象度＝包摂半順序束** $\mathbb{L}=(\mathbb{L},\preccurlyeq,\vee,\wedge,\top,\bot)$。$\bot=$物理層、$\top=$空（最大元）。$A(x)=0\iff\varphi(x)=\mathrm{LUB}$
- **Ego（最適制御）**：$\displaystyle \pi_c(x)=\arg\min_{u(t)}\int_0^T V_0(x(t),t)\,dt$
- 抽象度↑ ⇔ 情報量↓ ⇔ 意味的エントロピー↓
- **Self / Ego / TCZ は同一認知過程の3つの型付き表現**（意味論／制御／安定集合）

---

## 3. 基盤定理群（T1–T4）

**T1 苫米地主定理（個人TCZ収束）**
$$\pi_c=\arg\min_{u}\int V_0\,dt\ \Rightarrow\ x^*(t)\to TCZ(x_0)$$

**T2 共有TCZ収束定理**（結合グラフ連結・双方向正結合 $\gamma_{ij}=\gamma_{ji}>0$）
$$\pi_i=\arg\min_{u_i}\int\!\Big(V_{0,i}+\sum_j\gamma_{ij}S_{ij}\Big)dt\ \Rightarrow\ \mathbf{x}(t)\to TCZ_{\text{shared}}$$

**T3 LUB抽象定理**（$\mathbb{E}$ は LUB 位置の認識論的不確実性）
$$\pi_i=\arg\min_{u_i}\mathbb{E}\!\int\!\Big(V_i+\sum_j\gamma_{ij}S_{ij}+\eta_i A(x_i)\Big)dt,\quad A=0\iff\varphi=\mathrm{LUB}\ \Rightarrow\ \mathbf{x}\to\mathrm{LUB}$$

**T4 臨場感加重定理**（$P\in[0,1]$ 臨場感、$Q\in[-1,1]$ 価値符号、$\kappa>0$）
$$\tilde V(x,t):=V_0(x,t)-\kappa P(x,t)Q(x,t)\ge-\kappa,\qquad \pi_{cP}=\arg\min\int \tilde V\ \Rightarrow\ \mathrm{dist}(x(t),\Omega_P(t))\to0$$
$$\frac{\partial \tilde V}{\partial P}=-\kappa Q\ \ (\text{Q}>0\ \text{で臨場感}\,\uparrow\,\text{が実効コストを下げる})$$

---

## 4. ゴール・時間定理群（T7・T8・T9・T10）

**T7 真のゴール定理／ゴール外部性・制御再構成定理**　真のゴール $G$ の4条件：
1. **外部性** $G\notin TCZ_0$、$\mathrm{dist}(G,TCZ_0)>\varepsilon$
2. **Self 設定可能性** $s_{\text{Self}}(TCZ_0)=TCZ_G$
3. **高次自己整合性** $C_{\text{Self}}(G)>0$
4. **制御再構成** 十分な未来終端性の下で Ego の制御汎関数を変えうる

$$J_G[u]=\int_t^T V_0(x(\tau),\tau)d\tau+\lambda\,d(x(T),G)^2\quad(\lambda>0)$$

**T8 未来原点認知時間定理**（HJB を終端から後ろ向き積分 → 決定方向が未来→現在）
$$W_G(x,t)= \min_u J_G[u],\qquad u^*(t;G)=\arg\min J_G[u]\ \Rightarrow\ G\to u^*(t;G)$$
※物理時間の逆流ではなく「終端条件つき最適制御の依存方向」という構造的事実。

**T9 未来原点ゴール達成定理**（T7＝資格、T8＝方向、T9＝到達）
$$K_G=PQ^++EC_{\text{Self}}\ge K_{\text{crit}}\ \text{かつ}\ \Phi_G\ \text{が降下条件}\ \Rightarrow\ \mathrm{dist}(x(t),TCZ_G(t))\to0$$

**T10 認知宇宙定理／LUB基準認知時間定理**（層別 $L$、$\tau_L(x)=d_L(x,G_L)$）
$$\tau_L(t)\le\tau_L(0)e^{-c_L t}\ \Rightarrow\ \tau_L\to0$$
物理宇宙（最低抽象度）と認知宇宙（高抽象度）では**時間の実効方向が逆**（熱力学第二法則の否定ではない）。

---

## 5. エントロピー・自己・自由（T15・T16・T18・T19）

**T15 認知物理エントロピー交換・保存定理**
$$S_{\text{gen}}=\hat S_{\text{phys}}+\sum_{\alpha>0}w_\alpha \hat H_\alpha,\qquad \frac{dS_{\text{gen}}}{dt}=\Pi\ge0$$
物理層で成り立つのは第二法則の不等式のみ。**高抽象度レイヤーを含めて初めてエントロピーは保存**（命題15.D＝新知見）。

**T16 自己意識存在・発生定理**（逆極限＝自己意識空間）
$$SC_{i,h}=\varprojlim_{\alpha\in\mathfrak{A}_{16}}K_{i,\alpha}(h)\ \ni\ S^*_{i,h}\ \text{s.t.}\ F_{i,h}(S^*_{i,h})=S^*_{i,h}$$
縮小写像なら固定点は一意で $d(S_n,S^*)\le L^n d(S_0,S^*)$。※履歴相対的・機能的自己意識（クオリアは主張しない）。

**T18 内省言語進化定理**
$$H(Z\mid Y,M_\ell)<H(Z\mid Y),\quad \Pi_0\subseteq\Pi_\ell,\quad \partial\mathcal F/\partial\ell>0$$

**T19 自由意思定理**（ゴール条件付き制御容量）
$$\mathcal F_i(\alpha)=\sup_{d,\pi} I(G_d;Y_d^\pi\mid X_d),\qquad \alpha\preccurlyeq\beta\Rightarrow \mathcal F_i(\alpha)\le\mathcal F_i(\beta)$$
$\mathcal F_i(0)=\min,\ \mathcal F_i(\top)=\max$。決定論的方策とも両立（$I(G;Y\mid X)=H(G\mid X)$）。

---

## 6. 臨場感方向性（T20–T22）

- **T20 象徴臨場感方向性**：$P_\sigma=P+\lambda\,Sym_\sigma$、$\tilde V_\sigma=V_0-\kappa q_\sigma P_\sigma S_{u_\sigma}$ の下で $\dot D\le-c\|\nabla D\|_M^2<0$ → 象徴が指す LUB 方向へ正の成分。
- **T21 包摂半順序臨場感方向性**：偏り臨場感が閾値 $p>p_{\text{crit}}=\frac1{\kappa m}\max\{\beta,B/r\}$ を超えると一意の局所谷 $x_b^*$ を掘り指数吸引。有限ゴール変数でも $I(G;Y\mid X)>0$（正の自由意思容量と両立）。
- **T22 高高度LUB臨場感**：$u_{n+1}=u_n\vee v_{n+1}$（消去でなく**包摂**で段階更新）→ $u_n\prec u_{n+1}$、極限 $u_\infty\preccurlyeq\top$。

---

## 7. 象徴文化生成定理・進化定理・倫理制約（進化論5定理版）

進化論（5定理版）は **T1・T2・T3 ＋ 苫米地象徴文化生成定理 ＋ 苫米地進化定理** の最小体系。接続は「定理3 → 象徴文化生成 → 進化」。

**苫米地象徴文化生成定理**（仮定 A1–A4・A7）
$$\pi_{c_{\text{sym}}}=\arg\min_u\int_0^T P_{\text{sym}}(x(t),t)\,dt\ \Rightarrow\ \frac{\partial \tilde V_\sigma}{\partial\sigma}<0$$
$$P_{\sigma,i}=P_i+\lambda_i\,Sym_i(C;\sigma_i,\rho_i,\alpha_i),\qquad \tilde V_{\sigma,i}=V_i-\kappa_i P_{\sigma,i}Q_i$$
芸術・音楽・文学・宗教・儀式・神話・法・物語は、高抽象世界を**共有臨場感へ変換**し、個人間・世代間で保存・伝達する機構。$Q>0$ なら象徴能力 $\sigma$ が上がるほど高次の谷が深くなる。

**苫米地進化定理**（仮定 A1–A2・A8、$z=(\alpha,\rho,\sigma)$）
$$\pi_{\text{evo}}=\arg\max_{(\alpha,\rho,\sigma)}F,\qquad \dot z=M\nabla F\ \Rightarrow\ \frac{dF}{dt}\ge0$$
$$F_i(\alpha_i,\rho_i,\sigma_i)=\int\!\Big[-V_i+\beta_i Share_i+\nu_i G_i(\alpha_i)+\mu_i Pres_i+\omega_i Sym_i-C_i\Big]dt$$
限界利益条件（3不等式）のもとで、**利他性・芸術・宗教・平和への希求は進化の例外ではなく予測出力**。利己的遺伝子仮説は低抽象近似。

**倫理制約 Ethic(B)**：認知戦の欺瞞抑制項 $Decept(M)$ を民生用に置換。クライアント・組織の**自律性・尊厳・長期的利益・高抽象整合性**への侵害を罰する（ハーネスの最重要ガードレール）。

---

## 8. 四法印定理（T23–T26）

- **T23 諸行無常**：持続的厳密散逸 $\int_{t_1}^{t_2}\Pi>0\Rightarrow z(t_2)\neq z(t_1)$。空未満の段階TCZは有限段で固定しない。
- **T24 一切皆苦**：条件24-A（空未満で永久零苦不能）の下で $a\prec\top\Rightarrow J^*_{a,\rho}(x,T)>0$。
- **T25 諸法無我**：$\neg\exists S_0\,\forall h: F_{i,h}(S_0)=S_0$、かつ $\forall d\,\forall\alpha:\ \neg Atman(d,\alpha)$。全履歴共通固定点も、全抽象度レイヤーの固定的自性も無い（縁起）。
- **T26 涅槃寂静**：$\mathcal N_\top(T)=\mathcal B_{\text{alive}}\cap\{x\mid J^*_{\top,\rho}(x,T)=0\}$ が Lyapunov 安定なら
$$W_\top(x(t),t)\le W_\top(x(T),T)e^{-\lambda(t-T)}\Rightarrow \mathrm{dist}(x(t),\mathcal N_\top(t))\to0$$
生命活動を保ったまま苦を滅する**動的寂静**。

---

## 9. 縁起（T27 無明起行定理）

型付き操作的無明：
$$\text{Avijjā}_{27}(a,x,T):\iff \neg PZS(a,x,T)\iff [a\prec\top]\ \vee\ [a=\top\wedge x\notin\mathcal N_\top(T)]$$
Lyapunov 無明残差 $Ign_{27}(x,t):=W_\top(x,t)$。「無明に縁りて行が起こる」を、寂静未達 → 志向的形成作用（$\text{Saṅkhārā}_{27}$）として数理化。

---

## 10. 拡張定理（T28–T32）

| 定理 | 中心式 | 依存 | 要旨 |
|---|---|---|---|
| **T28** 涅槃無我・型整合 | $\mathfrak D_{\prec\top}\cap Nir(T)=\emptyset$; $PZS\iff[a=\top\wedge x\in\mathcal N_\top]$; $\neg Atman(d_{N,\top})$ | T24–26 | 「一切皆苦」と「涅槃寂静」はタグ付き直和で排他。涅槃過程も無我 |
| **T29** 形式法体系無自性・不完備 | $\exists G_h[\mathbb N\models G_h\wedge\mathbb T_h\nvdash G_h\wedge\mathbb T_h\nvdash\neg G_h]$; $\mathbb T_h\nvdash Con(\mathbb T_h)$ | T25＋Gödel/Chaitin | 十分に強い有効形式理論に限り決定不能・開放的更新・無自性 |
| **T30** エントロピー交換自我構成 | $d_{SC}(G_m^n S_0,S_m^*)\le(q_Fq_m)^n d_{SC}(S_0,S_m^*)$; $\Delta\mathcal H_{ego}\le0$ | T15・T16・T18 | 内省言語がEgoを選択・安定化。言語↑で自我エントロピー↓、差が物理側へ交換 |
| **T31** 内省言語閉包・低抽象度六道輪廻 | 言語閉包＋Nagumo不変性＋Lyapunov吸引性 → 低抽象度TCZからの脱出不能、六状態粗視化の再帰 | T1・T3・T16・T18 | 閉ループの内側に閉じ込められる構造 |
| **T32** 未来TCZホメオスタシス絶対他力 | $G\in\mathcal C_G(t)$（$t\ge t_0$）、未来限定Egoで指数収束・到達時間 | T1・T4・T7–9 | 旧Egoの追加努力なしに未来TCZへ自律収束（壁を破るのでなく、壁たらしめた条件が消える） |

---

## 11. コーチングの形式定義

- **コーチング＝並列宇宙（可能世界）$w_1$ から $w_2$ への移行を促す行為**（[コーチングの形式定義](https://tomabechi.jp/CoachingFormalDefinitionDrT20251005.pdf)）
- 関数：$p$（宇宙の存在を重要度順）＝Self、$q$（未来可能世界を重要度順）＝Goal、$r$（現在可能世界を並べ替え）＝Comfort Zone、$s$（全CZを全Goalに従い並べ替え）＝統合Self
- 生物学的には現状 $w_0$ が望ましい（ホメオスタシス）。コーチングでは現状から最も離れた**最高次ゴール $w_h$** が望ましい（**ハイパーホメオスタシス**）
- **エフィカシー**＝自身のゴールを達成する自己能力の自己評価。**高く保ち続けるだけ**。
- 結語：**「未来はまだ変えられないが、コンフォートゾーンは今変えられる」**／ゴールは反対されても「やりたいこと」／見えない（スコトーマ下の）ゴールは**利他性＝高抽象度**で見える／**ゴール達成はハイパーホメオスタシスにより自動で進む**（[コーチングの形式定義](https://tomabechi.jp/CoachingFormalDefinitionDrT20251005.pdf)）

---

## 12. 空とエントロピー（Emptiness 論文・情報学シンポジウム）

- 概念・存在を**部分関数**で定義 → 情報量の大小が**包摂順序**を生む
- 宇宙は**包摂半順序束**：$\text{bottom}=$矛盾（情報量が多すぎる状態）、$\text{top}=$**空**（全存在より少し情報量が少ない）
- 物理層 $=$ 抽象度が最も低い部分（インスタンス）。**エントロピーは物理では増大、認知・知識・生命空間では減少**（[情報学シンポジウム2023](http://tomabechi.jp/%E6%83%85%E5%A0%B1%E5%AD%A6%E3%82%B7%E3%83%B3%E3%83%9D%E3%82%B8%E3%82%A6%E3%83%A0%E8%8B%AB%E7%B1%B3%E5%9C%B0%E8%8B%B1%E4%BA%BA20230520.pdf)）
- 「空」は有と無の **LUB**。知識が増える＝抽象度が上がりランダム性が下がる（データ量増加とは本質的に別）

---

## 13. 認知戦とAI（NDU論文・Stimson）

- 「Cognitive Warfare」の語は著者が **2007年** に導入。
- 認知戦＝「対象集団の評価関数 $V(x,t)$ を外部から変形し TCZ を再構成、行動軌道を変化させるプロセス」＝**決断が下される地形そのものを変える**
- 生成AIの出力は本質的に**局所解**。演繹的数理制御構造なしのAI展開は戦略的整合性を損なう。
- **未来の戦場は物理空間ではなく、認知ポテンシャル構造そのものである**（[潜在ポテンシャル統一理論（NDU講義論文）](https://tomabechi.jp/TomabechiNDUpaperJApublic.pdf)）

---

## 14. 定理依存グラフ（要約）

```
        補題0（統一Lyapunov収束補題）
              │
  T1 ──→ T2 ──→ T3 ──→ T4          （基盤：個人／共有／LUB／臨場感）
              │
  T7 ──→ T8 ──→ T9 ──→ T10         （ゴール／時間／達成／認知宇宙）
              │
  T15 · T16 · T18 · T19             （エントロピー／自己意識／言語／自由意思）
              │
  T20 ─→ T21 ─→ T22                 （臨場感方向性）
              │
  T23 T24 T25 T26                   （四法印）→ T27（無明起行）
              │
  T28 ｜ T29 ｜ T30→[T31]→[T32]      （拡張：涅槃無我／法無自性／自我構成／六道／絶対他力）
```

---

## 15. コーチングハーネスへの実装含意

| 層 | 実装 | 対応定理 |
|---|---|---|
| 測定 | 残差 $\Phi$・距離 dist・臨場感 $P$・価値 $Q$・エフィカシー | T1, T4, T9 |
| ゴール管理 | ファイルベースの $G$（dist, λ, 外部性, 自己整合性）＝4条件チェック | T7 |
| 時間方向 | system prompt「ゴールから逆算せよ」＝終端条件起動 | T8 |
| ループ | 反復ホライズン、$\mathrm{dist}\to0$ で終了 | 補題0, T32 |
| 無明検出 | $\text{Avijjā}_{27}=\neg PZS$（寂静未達判定） | T27 |
| 自律化 | エフィカシーを高く保てば達成は自動（他力） | T32 |

**結論**：定理1–32 のうち、ハーネスに直接実装価値があるのは **T1・T4・T7・T8・T9・T27・T32** の7本。他は「なぜこの設計が正しいか」の理論的裏付け。

---
*出典：Dr. Hideto Tomabechi (Cognitive Research Labs / CMU CyLab / GMU C5I Center) 公開PDF・論文群。数式は各原典の標準形に準拠。*
