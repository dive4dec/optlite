{{/* Application Labels */}}
{{ define "app.labels" }}
{{- $chartName := .Chart.Name }}
{{- $chartVersion := .Chart.Version | replace "+" "_" }}
{{- $globalLabels := .global_labels }}
{{- range $key, $val := $globalLabels }}
{{ $key }}: {{ $val | quote }}
{{- end }}
"helm.sh/chart": {{ $chartName }}-{{ $chartVersion }}
{{ end }}