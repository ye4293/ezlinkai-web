'use client';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, ScrollText } from 'lucide-react';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: '同步日志设置', link: '/dashboard/setting/audit' }
];

interface Option {
  key: string;
  value: any;
}

export default function AuditSettingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [auditEnabled, setAuditEnabled] = useState(false);
  const [awsRegion, setAwsRegion] = useState('');
  const [awsAccessKeyId, setAwsAccessKeyId] = useState('');
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState('');
  const [firehoseStreamName, setFirehoseStreamName] = useState('');
  const [athenaDatabase, setAthenaDatabase] = useState('');
  const [athenaTable, setAthenaTable] = useState('');
  const [athenaWorkgroup, setAthenaWorkgroup] = useState('');
  const [athenaOutputLocation, setAthenaOutputLocation] = useState('');
  const [icebergTableLocation, setIcebergTableLocation] = useState('');
  const [auditChannelSize, setAuditChannelSize] = useState('');
  const [auditMaxBufferMB, setAuditMaxBufferMB] = useState('');
  const [auditDiskBufferDir, setAuditDiskBufferDir] = useState('');
  const [auditDiskBufferMaxGB, setAuditDiskBufferMaxGB] = useState('');
  const [auditBatchSize, setAuditBatchSize] = useState('');
  const [auditFlushIntervalSec, setAuditFlushIntervalSec] = useState('');
  const [auditMaxBodyKB, setAuditMaxBodyKB] = useState('');
  const [auditMaxRespKB, setAuditMaxRespKB] = useState('');
  const [auditRetentionDays, setAuditRetentionDays] = useState('');
  const [auditBodyS3Bucket, setAuditBodyS3Bucket] = useState('');
  const [auditBodyS3Prefix, setAuditBodyS3Prefix] = useState('');
  const [auditBodyS3ThresholdKB, setAuditBodyS3ThresholdKB] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/option');
        if (!res.ok) throw new Error('Failed to fetch options');
        const result = await res.json();
        if (result.success && result.data) {
          const options: Option[] = result.data;
          const auditConfigOption = options.find(
            (o) => o.key === 'auditConfig'
          );
          if (auditConfigOption && auditConfigOption.value) {
            try {
              const parsed = JSON.parse(auditConfigOption.value);
              setAuditEnabled(parsed.enabled === true);
              setAwsRegion(parsed.awsRegion || '');
              setAwsAccessKeyId(parsed.awsAccessKeyId || '');
              setFirehoseStreamName(parsed.firehoseStreamName || '');
              setAthenaDatabase(
                parsed.athenaDatabase || parsed.glueDatabase || ''
              );
              setAthenaTable(parsed.athenaTable || parsed.glueTable || '');
              setAthenaWorkgroup(parsed.athenaWorkgroup || '');
              setAthenaOutputLocation(parsed.athenaOutputLocation || '');
              setIcebergTableLocation(parsed.icebergTableLocation || '');
              setAuditChannelSize(
                parsed.channelSize ? String(parsed.channelSize) : ''
              );
              setAuditMaxBufferMB(
                parsed.maxBufferMB ? String(parsed.maxBufferMB) : ''
              );
              setAuditDiskBufferDir(parsed.diskBufferDir || '');
              setAuditDiskBufferMaxGB(
                parsed.diskBufferMaxGB ? String(parsed.diskBufferMaxGB) : ''
              );
              setAuditBatchSize(
                parsed.batchSize ? String(parsed.batchSize) : ''
              );
              setAuditFlushIntervalSec(
                parsed.flushIntervalSec ? String(parsed.flushIntervalSec) : ''
              );
              setAuditMaxBodyKB(
                parsed.maxBodyKB ? String(parsed.maxBodyKB) : ''
              );
              setAuditMaxRespKB(
                parsed.maxRespKB ? String(parsed.maxRespKB) : ''
              );
              setAuditRetentionDays(
                parsed.retentionDays ? String(parsed.retentionDays) : ''
              );
              setAuditBodyS3Bucket(parsed.bodyS3Bucket || '');
              setAuditBodyS3Prefix(parsed.bodyS3Prefix || '');
              setAuditBodyS3ThresholdKB(
                parsed.bodyS3ThresholdKB ? String(parsed.bodyS3ThresholdKB) : ''
              );
            } catch {
              // 忽略解析错误
            }
          }
        }
      } catch {
        // 忽略加载错误
      } finally {
        setIsDataLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      let secretKey = awsSecretAccessKey;
      if (!secretKey) {
        const res = await fetch('/api/option');
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            const raw = result.data.find((o: Option) => o.key === 'auditConfig')
              ?.value;
            if (raw) {
              try {
                const existing = JSON.parse(raw);
                secretKey = existing.awsSecretAccessKey || '';
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      }

      const config: Record<string, unknown> = {
        enabled: auditEnabled,
        awsRegion,
        awsAccessKeyId,
        firehoseStreamName,
        athenaDatabase,
        athenaTable,
        athenaWorkgroup,
        athenaOutputLocation,
        icebergTableLocation
      };
      if (secretKey) config.awsSecretAccessKey = secretKey;
      if (auditChannelSize) config.channelSize = parseInt(auditChannelSize, 10);
      if (auditMaxBufferMB) config.maxBufferMB = parseInt(auditMaxBufferMB, 10);
      if (auditDiskBufferDir) config.diskBufferDir = auditDiskBufferDir;
      if (auditDiskBufferMaxGB)
        config.diskBufferMaxGB = parseInt(auditDiskBufferMaxGB, 10);
      if (auditBatchSize) config.batchSize = parseInt(auditBatchSize, 10);
      if (auditFlushIntervalSec)
        config.flushIntervalSec = parseInt(auditFlushIntervalSec, 10);
      if (auditMaxBodyKB) config.maxBodyKB = parseInt(auditMaxBodyKB, 10);
      if (auditMaxRespKB) config.maxRespKB = parseInt(auditMaxRespKB, 10);
      if (auditRetentionDays)
        config.retentionDays = parseInt(auditRetentionDays, 10);
      if (auditBodyS3Bucket) config.bodyS3Bucket = auditBodyS3Bucket;
      if (auditBodyS3Prefix) config.bodyS3Prefix = auditBodyS3Prefix;
      if (auditBodyS3ThresholdKB)
        config.bodyS3ThresholdKB = parseInt(auditBodyS3ThresholdKB, 10);

      const response = await fetch('/api/option', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'auditConfig',
          value: JSON.stringify(config)
        })
      });
      if (!response.ok) throw new Error('Failed to save auditConfig');
      toast.success('同步日志配置保存成功！');
      setAwsSecretAccessKey('');
    } catch (error) {
      console.error('Save audit error:', error);
      toast.error('保存同步日志配置失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (isDataLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">同步日志设置</h2>
            <p className="text-muted-foreground">
              配置 AWS Firehose / Glue / Athena 审计日志同步
            </p>
          </div>
          <Separator />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5" />
                审计日志同步配置
              </CardTitle>
              <CardDescription>
                配置访问 AWS Glue、Firehose、Athena 所需的凭证与服务参数
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 启用开关 */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="audit-enabled"
                    className="text-base font-medium"
                  >
                    启用同步日志
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    开启后，系统将使用以下 AWS 配置同步审计日志
                  </p>
                </div>
                <Switch
                  id="audit-enabled"
                  checked={auditEnabled}
                  onCheckedChange={setAuditEnabled}
                />
              </div>

              {auditEnabled && (
                <div className="space-y-6">
                  {/* AWS 基础凭证 */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      AWS 基础凭证
                    </p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="aws-region">AWS Region</Label>
                        <Input
                          id="aws-region"
                          value={awsRegion}
                          onChange={(e) => setAwsRegion(e.target.value)}
                          placeholder="例如：us-east-1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="aws-access-key-id">Access Key ID</Label>
                        <Input
                          id="aws-access-key-id"
                          value={awsAccessKeyId}
                          onChange={(e) => setAwsAccessKeyId(e.target.value)}
                          placeholder="AKIA..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="aws-secret-access-key">
                          Secret Access Key
                        </Label>
                        <Input
                          id="aws-secret-access-key"
                          type="password"
                          value={awsSecretAccessKey}
                          onChange={(e) =>
                            setAwsSecretAccessKey(e.target.value)
                          }
                          placeholder="敏感信息不会发送到前端显示"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Firehose 配置 */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      AWS Firehose
                    </p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firehose-stream-name">
                          Delivery Stream 名称
                        </Label>
                        <Input
                          id="firehose-stream-name"
                          value={firehoseStreamName}
                          onChange={(e) =>
                            setFirehoseStreamName(e.target.value)
                          }
                          placeholder="例如：my-audit-stream"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Glue/Athena 数据目录 */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      Glue/Athena 数据目录（共用同一 Glue Catalog）
                    </p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="athena-database">数据库名称</Label>
                        <Input
                          id="athena-database"
                          value={athenaDatabase}
                          onChange={(e) => setAthenaDatabase(e.target.value)}
                          placeholder="例如：audit_db"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="athena-table">表名称</Label>
                        <Input
                          id="athena-table"
                          value={athenaTable}
                          onChange={(e) => setAthenaTable(e.target.value)}
                          placeholder="例如：audit_logs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Athena 配置 */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      AWS Athena
                    </p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="athena-workgroup">工作组</Label>
                        <Input
                          id="athena-workgroup"
                          value={athenaWorkgroup}
                          onChange={(e) => setAthenaWorkgroup(e.target.value)}
                          placeholder="例如：primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="athena-output-location">
                          S3 查询结果路径
                        </Label>
                        <Input
                          id="athena-output-location"
                          value={athenaOutputLocation}
                          onChange={(e) =>
                            setAthenaOutputLocation(e.target.value)
                          }
                          placeholder="例如：s3://my-bucket/athena-output/"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Iceberg 表路径 */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      Iceberg 表
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="iceberg-table-location">
                        Iceberg 表数据存储路径
                      </Label>
                      <Input
                        id="iceberg-table-location"
                        value={icebergTableLocation}
                        onChange={(e) =>
                          setIcebergTableLocation(e.target.value)
                        }
                        placeholder="例如：s3://my-bucket/iceberg/audit_logs/"
                      />
                    </div>
                  </div>

                  {/* 高级性能配置 */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      高级性能配置（留空则使用环境变量默认值）
                    </p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="audit-channel-size">队列缓冲大小</Label>
                        <Input
                          id="audit-channel-size"
                          type="number"
                          value={auditChannelSize}
                          onChange={(e) => setAuditChannelSize(e.target.value)}
                          placeholder="默认 2000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="audit-max-buffer-mb">
                          内存缓冲上限 (MB)
                        </Label>
                        <Input
                          id="audit-max-buffer-mb"
                          type="number"
                          value={auditMaxBufferMB}
                          onChange={(e) => setAuditMaxBufferMB(e.target.value)}
                          placeholder="默认 1024"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="audit-batch-size">批量发送条数</Label>
                        <Input
                          id="audit-batch-size"
                          type="number"
                          value={auditBatchSize}
                          onChange={(e) => setAuditBatchSize(e.target.value)}
                          placeholder="默认 500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="audit-flush-interval-sec">
                          刷新间隔 (秒)
                        </Label>
                        <Input
                          id="audit-flush-interval-sec"
                          type="number"
                          value={auditFlushIntervalSec}
                          onChange={(e) =>
                            setAuditFlushIntervalSec(e.target.value)
                          }
                          placeholder="默认 10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="audit-max-body-kb">
                          请求体截断 (KB)
                        </Label>
                        <Input
                          id="audit-max-body-kb"
                          type="number"
                          value={auditMaxBodyKB}
                          onChange={(e) => setAuditMaxBodyKB(e.target.value)}
                          placeholder="默认 10240"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="audit-max-resp-kb">
                          响应体截断 (KB)
                        </Label>
                        <Input
                          id="audit-max-resp-kb"
                          type="number"
                          value={auditMaxRespKB}
                          onChange={(e) => setAuditMaxRespKB(e.target.value)}
                          placeholder="默认 4096"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="audit-retention-days">
                          数据保留天数
                        </Label>
                        <Input
                          id="audit-retention-days"
                          type="number"
                          value={auditRetentionDays}
                          onChange={(e) =>
                            setAuditRetentionDays(e.target.value)
                          }
                          placeholder="默认 0（不删除）"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="audit-disk-buffer-max-gb">
                          磁盘溢出上限 (GB)
                        </Label>
                        <Input
                          id="audit-disk-buffer-max-gb"
                          type="number"
                          value={auditDiskBufferMaxGB}
                          onChange={(e) =>
                            setAuditDiskBufferMaxGB(e.target.value)
                          }
                          placeholder="默认 40"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="audit-disk-buffer-dir">
                          磁盘溢出目录
                        </Label>
                        <Input
                          id="audit-disk-buffer-dir"
                          value={auditDiskBufferDir}
                          onChange={(e) =>
                            setAuditDiskBufferDir(e.target.value)
                          }
                          placeholder="默认 ./data/audit_spill"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 大请求体 S3 存储 */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      大请求体 S3 存储（超过阈值的 body 上传 S3，留空则不启用）
                    </p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="audit-body-s3-bucket">
                          S3 存储桶名称
                        </Label>
                        <Input
                          id="audit-body-s3-bucket"
                          value={auditBodyS3Bucket}
                          onChange={(e) => setAuditBodyS3Bucket(e.target.value)}
                          placeholder="例：my-audit-bucket"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="audit-body-s3-prefix">
                          S3 Key 前缀
                        </Label>
                        <Input
                          id="audit-body-s3-prefix"
                          value={auditBodyS3Prefix}
                          onChange={(e) => setAuditBodyS3Prefix(e.target.value)}
                          placeholder="默认 audit-bodies"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="audit-body-s3-threshold">
                          上传阈值 (KB)
                        </Label>
                        <Input
                          id="audit-body-s3-threshold"
                          type="number"
                          value={auditBodyS3ThresholdKB}
                          onChange={(e) =>
                            setAuditBodyS3ThresholdKB(e.target.value)
                          }
                          placeholder="默认 32"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={handleSave} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                保存同步日志配置
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
